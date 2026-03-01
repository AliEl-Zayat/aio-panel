"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  invoicesService,
  type Invoice,
  type InvoiceLineItemInput,
  type CreateInvoiceBody,
  type InvoiceDirection,
  type ClientSuggestion,
} from "@/services/invoices.service";
import { inventoryService, type Product } from "@/services/inventory.service";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressWithMapPicker } from "@/components/address-with-map-picker";
import { AxiosError } from "axios";
import { Trash2 } from "lucide-react";

const SUGGESTIONS_DEBOUNCE_MS = 250;

const DEFAULT_LINE: InvoiceLineItemInput = {
  description: "",
  quantity: 1,
  unitPrice: 0,
  discountAmount: 0,
  productId: null,
};

/** Persisted form values (survives refresh / tab close). */
interface InvoiceFormValues {
  direction: InvoiceDirection;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  dueDate: string;
  currency: string;
  notes: string;
  discountAmount: number;
  lines: InvoiceLineItemInput[];
}

function getEmptyInvoiceFormValues(): InvoiceFormValues {
  return {
    direction: "OUTGOING",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    dueDate: "",
    currency: "USD",
    notes: "",
    discountAmount: 0,
    lines: [{ ...DEFAULT_LINE }],
  };
}

function invoiceToFormValues(inv: Invoice): InvoiceFormValues {
  return {
    direction: inv.direction ?? "OUTGOING",
    clientName: inv.clientName,
    clientEmail: inv.clientEmail ?? "",
    clientAddress: inv.clientAddress ?? "",
    dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : "",
    currency: inv.currency ?? "USD",
    notes: inv.notes ?? "",
    discountAmount: inv.discountAmount ?? 0,
    lines:
      inv.lineItems?.length > 0
        ? inv.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            discountAmount: li.discountAmount ?? 0,
            productId: li.productId,
          }))
        : [{ ...DEFAULT_LINE }],
  };
}

export interface InvoiceFormProps {
  readonly invoice?: Invoice | null;
  readonly onSuccess: (invoice: Invoice) => void;
  readonly onCancel?: () => void;
}

export function InvoiceForm({
  invoice,
  onSuccess,
  onCancel,
}: InvoiceFormProps) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(invoice);
  const defaultValues: InvoiceFormValues =
    isEdit && invoice
      ? invoiceToFormValues(invoice)
      : getEmptyInvoiceFormValues();
  const storageKey =
    isEdit && invoice
      ? `form-draft:invoice:edit:${invoice.id}`
      : "form-draft:invoice:new";
  const [formValues, setFormValues, clearDraft] = usePersistedFormState(
    storageKey,
    defaultValues,
    { debounceMs: 400 }
  );
  const {
    direction,
    clientName,
    clientEmail,
    clientAddress,
    dueDate,
    currency,
    notes,
    discountAmount,
    lines,
  } = formValues;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<
    ClientSuggestion[]
  >([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [openLineProductIndex, setOpenLineProductIndex] = useState<
    number | null
  >(null);
  const clientSuggestionsTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const fetchClientSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setClientSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const { suggestions } = await invoicesService.getClientSuggestions(
        query.trim()
      );
      setClientSuggestions(suggestions);
      setShowSuggestionsDropdown(true);
    } catch {
      setClientSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientSuggestionsTimeoutRef.current) {
      clearTimeout(clientSuggestionsTimeoutRef.current);
      clientSuggestionsTimeoutRef.current = null;
    }
    const q = clientName.trim();
    if (q.length < 1) {
      setClientSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }
    setShowSuggestionsDropdown(true);
    clientSuggestionsTimeoutRef.current = setTimeout(() => {
      clientSuggestionsTimeoutRef.current = null;
      void fetchClientSuggestions(q);
    }, SUGGESTIONS_DEBOUNCE_MS);
    return () => {
      if (clientSuggestionsTimeoutRef.current) {
        clearTimeout(clientSuggestionsTimeoutRef.current);
      }
    };
  }, [clientName, fetchClientSuggestions]);

  function selectClientSuggestion(s: ClientSuggestion) {
    setFormValues((prev) => ({
      ...prev,
      clientName: s.name,
      clientEmail: s.type === "person" ? s.email ?? "" : prev.clientEmail,
      clientAddress: s.type === "person" ? s.address ?? "" : prev.clientAddress,
    }));
    setClientSuggestions([]);
    setShowSuggestionsDropdown(false);
  }

  const { data: products = [] } = useQuery({
    queryKey: ["inventory", "products"],
    queryFn: () => inventoryService.getProducts(),
  });

  const subtotal = lines.reduce(
    (sum, l) =>
      sum + Math.max(0, l.quantity * l.unitPrice - (l.discountAmount ?? 0)),
    0
  );
  const total = Math.max(0, subtotal - discountAmount);

  function addLine() {
    setFormValues((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...DEFAULT_LINE }],
    }));
  }

  function removeLine(index: number) {
    setFormValues((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  }

  function updateLine(
    index: number,
    field: keyof InvoiceLineItemInput,
    value: string | number | null
  ) {
    setFormValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i !== index ? line : { ...line, [field]: value }
      ),
    }));
  }

  function getLineProductDisplayValue(line: InvoiceLineItemInput): string {
    if (line.productId != null) {
      const p = products.find((x) => x.id === line.productId);
      return p ? p.name : line.description;
    }
    return line.description;
  }

  function selectLineProduct(index: number, product: Product) {
    setFormValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i !== index
          ? line
          : {
              ...line,
              productId: product.id,
              description: product.name,
              unitPrice: product.unitPrice ?? 0,
            }
      ),
    }));
    setOpenLineProductIndex(null);
  }

  function onLineProductInputChange(index: number, value: string) {
    setFormValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i !== index ? line : { ...line, productId: null, description: value }
      ),
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientName.trim()) return;
    const validLines = lines.filter(
      (l) => l.description.trim() && l.quantity > 0
    );
    if (validLines.length === 0) return;

    const body: CreateInvoiceBody = {
      direction,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || null,
      clientAddress: clientAddress.trim() || null,
      dueDate: dueDate ? dueDate : null,
      currency: currency.trim() || "USD",
      notes: notes.trim() || null,
      discountAmount,
      lineItems: validLines.map((l) => ({
        description: l.description.trim(),
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountAmount: l.discountAmount ?? 0,
        productId: l.productId ?? null,
      })),
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEdit && invoice) {
        const updated = await invoicesService.updateInvoice(invoice.id, body);
        clearDraft();
        onSuccess(updated);
      } else {
        const created = await invoicesService.createInvoice(body);
        clearDraft();
        onSuccess(created);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setSubmitError(
        axiosError.response?.data?.error ?? "Failed to save invoice."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="direction">{t("direction")}</Label>
        <select
          id="direction"
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={direction}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              direction: e.target.value as InvoiceDirection,
            }))
          }
        >
          <option value="OUTGOING">{t("directionOutgoing")}</option>
          <option value="INCOMING">{t("directionIncoming")}</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 relative">
          <Label htmlFor="clientName">{t("clientOrSupplier")}</Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, clientName: e.target.value }))
            }
            onFocus={() =>
              clientSuggestions.length > 0 && setShowSuggestionsDropdown(true)
            }
            onBlur={() =>
              setTimeout(() => setShowSuggestionsDropdown(false), 180)
            }
            required
            placeholder={t("clientName")}
            autoComplete="off"
          />
          {showSuggestionsDropdown && clientName.trim().length >= 1 && (
            <div
              className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
              onMouseDown={(e) => e.preventDefault()}
              role="listbox"
            >
              {suggestionsLoading ? (
                <div className="p-3 text-sm text-muted-foreground">…</div>
              ) : clientSuggestions.length > 0 ? (
                <ul className="max-h-60 overflow-auto py-1">
                  {clientSuggestions.map((s) => (
                    <li key={`${s.type}-${s.id}`} role="option">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none"
                        onClick={() => selectClientSuggestion(s)}
                      >
                        <span className="font-medium">{s.name}</span>
                        {s.type === "person" && (s.email ?? s.phone) && (
                          <span className="ml-2 text-muted-foreground">
                            {[s.email, s.phone].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        {s.type === "company" && (
                          <span className="ml-2 text-muted-foreground text-xs">
                            Company
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">
                  {t("noClientSuggestions")}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientEmail">{t("clientEmail")}</Label>
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) =>
              setFormValues((prev) => ({
                ...prev,
                clientEmail: e.target.value,
              }))
            }
            placeholder={t("clientEmail")}
          />
        </div>
      </div>
      <AddressWithMapPicker
        id="clientAddress"
        label={t("clientAddress")}
        value={clientAddress}
        onChange={(value) =>
          setFormValues((prev) => ({ ...prev, clientAddress: value }))
        }
        placeholder={t("clientAddress")}
        rows={2}
        pickOnMapLabel={t("pickOnMap")}
        pickOnMapTitle={t("pickOnMapTitle")}
        pickOnMapHint={t("pickOnMapHint")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">{t("dueDate")}</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, dueDate: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">{t("currency")}</Label>
          <Input
            id="currency"
            value={currency}
            onChange={(e) =>
              setFormValues((prev) => ({
                ...prev,
                currency: e.target.value.toUpperCase().slice(0, 3),
              }))
            }
            maxLength={3}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoiceDiscount">{t("invoiceDiscount")}</Label>
        <Input
          id="invoiceDiscount"
          type="number"
          min={0}
          step="any"
          value={discountAmount || ""}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              discountAmount: Number(e.target.value) || 0,
            }))
          }
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{t("lineItems")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            {t("addLine")}
          </Button>
        </div>
        <div className="space-y-3">
          {lines.map((line, index) => {
            const query = line.description.trim().toLowerCase();
            const productSuggestions =
              query.length >= 1
                ? products.filter(
                    (p) =>
                      p.name.toLowerCase().includes(query) ||
                      (p.sku ?? "").toLowerCase().includes(query)
                  )
                : products.slice(0, 20);
            const showProductDropdown = openLineProductIndex === index;
            return (
              <div
                key={index}
                className="flex flex-wrap items-end gap-2 p-3 border rounded-md"
              >
                <div className="flex-1 min-w-[200px] space-y-1 relative">
                  <Label className="text-xs" htmlFor={`line-product-${index}`}>
                    {t("lineItemProduct")} / {t("lineItemDescription")}
                  </Label>
                  <Input
                    id={`line-product-${index}`}
                    value={getLineProductDisplayValue(line)}
                    onChange={(e) =>
                      onLineProductInputChange(index, e.target.value)
                    }
                    onFocus={() => setOpenLineProductIndex(index)}
                    onBlur={() =>
                      setTimeout(() => setOpenLineProductIndex(null), 180)
                    }
                    placeholder={t("lineItemDescriptionPlaceholder")}
                    autoComplete="off"
                    aria-describedby={
                      index === 0 ? "line-product-hint" : undefined
                    }
                  />
                  {showProductDropdown && (
                    <div
                      className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-48 overflow-auto"
                      onMouseDown={(e) => e.preventDefault()}
                      role="listbox"
                    >
                      {productSuggestions.length > 0 ? (
                        <ul className="py-1">
                          {productSuggestions.map((p) => (
                            <li key={p.id} role="option">
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none"
                                onClick={() => selectLineProduct(index, p)}
                              >
                                <span className="font-medium">{p.name}</span>
                                {p.sku && (
                                  <span className="ml-2 text-muted-foreground text-xs">
                                    {p.sku}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground">
                          {t("noProductSuggestions")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="any"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(index, "quantity", Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">{t("price")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={line.unitPrice || ""}
                    onChange={(e) =>
                      updateLine(
                        index,
                        "unitPrice",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">{t("lineDiscount")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={line.discountAmount ?? ""}
                    onChange={(e) =>
                      updateLine(
                        index,
                        "discountAmount",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 1}
                  aria-label="Remove line"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-sm font-medium">
          {t("total")}: {total.toFixed(2)} {currency}
          {discountAmount > 0 && (
            <span className="text-muted-foreground ms-2">
              ({t("invoiceDiscount")}: {discountAmount.toFixed(2)})
            </span>
          )}
        </p>
      </div>

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
