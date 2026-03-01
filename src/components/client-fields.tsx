"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressWithMapPicker } from "@/components/address-with-map-picker";
import {
  invoicesService,
  type ClientSuggestion,
} from "@/services/invoices.service";

const SUGGESTIONS_DEBOUNCE_MS = 250;

export interface ClientFieldsValue {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
}

export interface ClientFieldsProps {
  value: ClientFieldsValue;
  onChange: (value: ClientFieldsValue) => void;
  /** When true, clientName is required (e.g. for invoice submit). */
  required?: boolean;
}

export function ClientFields({
  value,
  onChange,
  required = false,
}: ClientFieldsProps) {
  const t = useTranslations("invoices");
  const { clientName, clientEmail, clientAddress } = value;
  const [clientSuggestions, setClientSuggestions] = useState<
    ClientSuggestion[]
  >([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const q = clientName.trim();
    if (q.length < 1) {
      setClientSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }
    setShowSuggestionsDropdown(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void fetchSuggestions(q);
    }, SUGGESTIONS_DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [clientName, fetchSuggestions]);

  function selectSuggestion(s: ClientSuggestion) {
    onChange({
      clientName: s.name,
      clientEmail: s.type === "person" ? s.email ?? "" : clientEmail,
      clientAddress: s.type === "person" ? s.address ?? "" : clientAddress,
    });
    setShowSuggestionsDropdown(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        <Label htmlFor="clientName">{t("clientOrSupplier")}</Label>
        <Input
          id="clientName"
          value={clientName}
          onChange={(e) =>
            onChange({ ...value, clientName: e.target.value })
          }
          onFocus={() =>
            clientSuggestions.length > 0 && setShowSuggestionsDropdown(true)
          }
          onBlur={() =>
            setTimeout(() => setShowSuggestionsDropdown(false), 180)
          }
          required={required}
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
                      onClick={() => selectSuggestion(s)}
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
            onChange({ ...value, clientEmail: e.target.value })
          }
          placeholder={t("clientEmail")}
        />
      </div>
      <AddressWithMapPicker
        id="clientAddress"
        label={t("clientAddress")}
        value={clientAddress}
        onChange={(address) =>
          onChange({ ...value, clientAddress: address })
        }
        placeholder={t("clientAddress")}
        rows={2}
        pickOnMapLabel={t("pickOnMap")}
        pickOnMapTitle={t("pickOnMapTitle")}
        pickOnMapHint={t("pickOnMapHint")}
      />
    </div>
  );
}
