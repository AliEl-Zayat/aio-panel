"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  inventoryService,
  type Product,
  type CreateProductBody,
  type UpdateProductBody,
} from "@/services/inventory.service";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError } from "axios";

const NAME_MAX_LENGTH = 200;

interface ProductFormValues {
  name: string;
  sku: string;
  description: string;
  imageUrl: string;
  unit: string;
  unitPrice: string;
  densityGPerCm3: string;
  currency: string;
  lowStockThreshold: string;
}

function getEmptyProductFormValues(): ProductFormValues {
  return {
    name: "",
    sku: "",
    description: "",
    imageUrl: "",
    unit: "pcs",
    unitPrice: "",
    densityGPerCm3: "",
    currency: "",
    lowStockThreshold: "",
  };
}

function productToFormValues(p: Product): ProductFormValues {
  return {
    name: p.name,
    sku: p.sku ?? "",
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? "",
    unit: p.unit,
    unitPrice:
      p.unitPrice != null ? String(p.unitPrice) : "",
    densityGPerCm3:
      p.densityGPerCm3 != null ? String(p.densityGPerCm3) : "",
    currency: p.currency ?? "",
    lowStockThreshold:
      p.lowStockThreshold != null ? String(p.lowStockThreshold) : "",
  };
}
const SKU_MAX_LENGTH = 100;
const UNIT_MAX_LENGTH = 50;
const CURRENCY_LENGTH = 3;

export interface ProductFormProps {
  readonly product?: Product | null;
  readonly onSuccess: (product: Product) => void;
  readonly onCancel?: () => void;
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(product);
  const defaultValues: ProductFormValues = isEdit && product
    ? productToFormValues(product)
    : getEmptyProductFormValues();
  const storageKey = isEdit && product
    ? `form-draft:product:edit:${product.id}`
    : "form-draft:product:new";
  const [formValues, setFormValues, clearDraft] = usePersistedFormState(
    storageKey,
    defaultValues,
    { debounceMs: 400 }
  );
  const {
    name,
    sku,
    description,
    imageUrl,
    unit,
    unitPrice,
    densityGPerCm3,
    currency,
    lowStockThreshold,
  } = formValues;

  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateName = useCallback(
    (value: string): string | null => {
      if (!value.trim()) return tCommon("nameRequired");
      if (value.length > NAME_MAX_LENGTH)
        return tCommon("nameMaxLength", { max: NAME_MAX_LENGTH });
      return null;
    },
    [tCommon]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const trimmedName = name.trim();
    const nErr = validateName(trimmedName);
    setNameError(nErr);
    if (nErr) return;

    const parsedUnitPrice = (() => {
      if (unitPrice.trim() === "") return null;
      const n = Number.parseFloat(unitPrice);
      return Number.isNaN(n) || n < 0 ? null : n;
    })();

    const parsedDensity = (() => {
      if (densityGPerCm3.trim() === "") return null;
      const n = Number.parseFloat(densityGPerCm3);
      return Number.isNaN(n) || n < 0 || n > 50 ? null : n;
    })();

    const body: CreateProductBody = {
      name: trimmedName,
      sku: sku.trim() || null,
      description: description.trim() || null,
      imageUrl: imageUrl.trim() || null,
      unit: unit.trim() || "pcs",
      unitPrice: parsedUnitPrice,
      densityGPerCm3: parsedDensity,
      currency:
        currency.trim().length === CURRENCY_LENGTH
          ? currency.trim().toUpperCase()
          : null,
      lowStockThreshold: (() => {
        const n = Number.parseInt(lowStockThreshold, 10);
        return lowStockThreshold.trim() === "" || Number.isNaN(n) || n < 0
          ? null
          : n;
      })(),
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEdit && product) {
        const updateBody: UpdateProductBody = { ...body };
        const updated = await inventoryService.updateProduct(
          product.id,
          updateBody
        );
        clearDraft();
        onSuccess(updated);
      } else {
        const created = await inventoryService.createProduct(body);
        clearDraft();
        onSuccess(created);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setSubmitError(
        axiosError.response?.data?.error ?? "Failed to save product."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product-name">{t("name")}</Label>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setFormValues((prev) => ({ ...prev, name: v }));
            setNameError(validateName(v));
          }}
          maxLength={NAME_MAX_LENGTH}
          placeholder={t("name")}
          aria-invalid={nameError != null}
        />
        {nameError && (
          <p className="text-sm text-destructive" role="alert">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-sku">{t("sku")}</Label>
        <Input
          id="product-sku"
          value={sku}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, sku: e.target.value }))
          }
          maxLength={SKU_MAX_LENGTH}
          placeholder={t("sku")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-description">{t("description")}</Label>
        <Textarea
          id="product-description"
          value={description}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={2}
          placeholder={t("description")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-imageUrl">{t("photoUrl")}</Label>
        <Input
          id="product-imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => {
            setFormValues((prev) => ({ ...prev, imageUrl: e.target.value }));
            setUploadError(null);
          }}
          placeholder="https://…"
        />
        {isEdit && product && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:text-sm"
              disabled={isUploadingImage}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f || !product) return;
                setUploadError(null);
                setIsUploadingImage(true);
                try {
                  const updated = await inventoryService.uploadProductImage(
                    product.id,
                    f
                  );
                  setFormValues((prev) => ({
                    ...prev,
                    imageUrl: updated.imageUrl ?? "",
                  }));
                } catch (err) {
                  const axiosErr = err as AxiosError<{ error?: string }>;
                  setUploadError(
                    axiosErr.response?.data?.error ?? "Upload failed"
                  );
                } finally {
                  setIsUploadingImage(false);
                  e.target.value = "";
                }
              }}
            />
            <span className="text-muted-foreground text-sm">
              {isUploadingImage ? tCommon("saving") : t("uploadImage")}
            </span>
          </div>
        )}
        {isEdit && product && (
          <p className="text-muted-foreground text-xs">{t("uploadImageHint")}</p>
        )}
        {uploadError && (
          <p className="text-sm text-destructive" role="alert">
            {uploadError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-unit">{t("unit")}</Label>
        <Input
          id="product-unit"
          value={unit}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, unit: e.target.value }))
          }
          maxLength={UNIT_MAX_LENGTH}
          placeholder="e.g. pcs, kg"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-unitPrice">{t("unitPrice")}</Label>
        <Input
          id="product-unitPrice"
          type="number"
          min={0}
          step="0.01"
          value={unitPrice}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, unitPrice: e.target.value }))
          }
          placeholder={t("unitPricePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-densityGPerCm3">{t("densityGPerCm3")}</Label>
        <Input
          id="product-densityGPerCm3"
          type="number"
          min={0}
          max={50}
          step="0.01"
          value={densityGPerCm3}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              densityGPerCm3: e.target.value,
            }))
          }
          placeholder={t("densityPlaceholder")}
        />
        <p className="text-muted-foreground text-xs">
          {t("densityHint")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-currency">{t("currency")}</Label>
        <Input
          id="product-currency"
          value={currency}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              currency: e.target.value.toUpperCase().slice(0, 3),
            }))
          }
          maxLength={CURRENCY_LENGTH}
          placeholder="USD"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-lowStock">{t("lowStockThreshold")}</Label>
        <Input
          id="product-lowStock"
          type="number"
          min={0}
          value={lowStockThreshold}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              lowStockThreshold: e.target.value,
            }))
          }
          placeholder="Optional"
        />
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
