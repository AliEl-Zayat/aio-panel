"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  inventoryService,
  type StockMovementType,
  type CreateMovementBody,
} from "@/services/inventory.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError } from "axios";

const MANUAL_TYPES: StockMovementType[] = [
  "PURCHASE",
  "ADJUSTMENT",
  "RETURN",
];

export interface RecordMovementFormProps {
  productId: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function RecordMovementForm({
  productId,
  onSuccess,
  onCancel,
}: RecordMovementFormProps) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const [type, setType] = useState<StockMovementType>("PURCHASE");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeLabel: Record<StockMovementType, string> = {
    PURCHASE: t("typePurchase"),
    SALE: t("typeSale"),
    ADJUSTMENT: t("typeAdjustment"),
    RETURN: t("typeReturn"),
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const num = Number(quantity);
    if (Number.isNaN(num) || num === 0) {
      setQuantityError("Enter a non-zero number.");
      return;
    }
    if (type !== "ADJUSTMENT" && num <= 0) {
      setQuantityError("Enter a positive number for purchase or return.");
      return;
    }
    const quantityDelta = type === "ADJUSTMENT" ? num : num;
    setQuantityError(null);
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const body: CreateMovementBody = {
        quantityDelta,
        type,
        note: note.trim() || null,
      };
      await inventoryService.createMovement(productId, body);
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; message?: string }>;
      setSubmitError(
        axiosError.response?.data?.error ??
          axiosError.response?.data?.message ??
          "Failed to record movement."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="movement-type">{t("type")}</Label>
        <select
          id="movement-type"
          value={type}
          onChange={(e) => setType(e.target.value as StockMovementType)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {MANUAL_TYPES.map((tpe) => (
            <option key={tpe} value={tpe}>
              {typeLabel[tpe]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="movement-quantity">
          {type === "ADJUSTMENT"
            ? t("quantityDelta") + " (negative = decrease)"
            : t("quantityDelta")}
        </Label>
        <Input
          id="movement-quantity"
          type="number"
          step="any"
          min={type === "ADJUSTMENT" ? undefined : "1"}
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setQuantityError(null);
          }}
          placeholder="0"
          aria-invalid={quantityError != null}
        />
        {quantityError && (
          <p className="text-sm text-destructive" role="alert">
            {quantityError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="movement-note">{t("note")}</Label>
        <Textarea
          id="movement-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={t("note")}
        />
      </div>
      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : t("recordMovement")}
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
