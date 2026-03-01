"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { companyService } from "@/services/company.service";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import type { Company } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

const NAME_MAX_LENGTH = 200;
const SLUG_MAX_LENGTH = 100;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface CompanyFormValues {
  name: string;
  slug: string;
  logoUrl: string;
}

function getEmptyCompanyFormValues(): CompanyFormValues {
  return { name: "", slug: "", logoUrl: "" };
}

function companyToFormValues(c: Company): CompanyFormValues {
  return {
    name: c.name,
    slug: c.slug,
    logoUrl: c.logoUrl ?? "",
  };
}

export interface CompanyFormProps {
  readonly company?: Company | null;
  readonly onSuccess: (company: Company) => void;
  readonly onCancel?: () => void;
}

export function CompanyForm({
  company,
  onSuccess,
  onCancel,
}: CompanyFormProps) {
  const t = useTranslations("knowledge");
  const tCommon = useTranslations("common");
  const isEdit = company != null;
  const defaultValues: CompanyFormValues =
    isEdit && company ? companyToFormValues(company) : getEmptyCompanyFormValues();
  const storageKey =
    isEdit && company
      ? `form-draft:company:edit:${company.id}`
      : "form-draft:company:new";
  const [formValues, setFormValues, clearDraft] = usePersistedFormState(
    storageKey,
    defaultValues,
    { debounceMs: 400 }
  );
  const { name, slug, logoUrl } = formValues;

  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = useCallback(
    (value: string): string | null => {
      if (!value.trim()) return tCommon("nameRequired");
      if (value.length > NAME_MAX_LENGTH)
        return tCommon("nameMaxLength", { max: NAME_MAX_LENGTH });
      return null;
    },
    [tCommon]
  );

  const validateSlug = useCallback(
    (value: string): string | null => {
      if (!value.trim()) return tCommon("slugRequired");
      if (value.length > SLUG_MAX_LENGTH)
        return tCommon("slugMaxLength", { max: SLUG_MAX_LENGTH });
      if (!SLUG_REGEX.test(value)) return tCommon("slugInvalid");
      return null;
    },
    [tCommon]
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormValues((prev) => ({ ...prev, name: value }));
    setNameError(validateName(value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replaceAll(/\s+/g, "-");
    setFormValues((prev) => ({ ...prev, slug: value }));
    setSlugError(validateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const nErr = validateName(trimmedName);
    const sErr = validateSlug(trimmedSlug);
    setNameError(nErr);
    setSlugError(sErr);
    if (nErr ?? sErr) return;

    setIsSubmitting(true);
    setSlugError(null);
    setSubmitError(null);
    try {
      if (isEdit) {
        const updated = await companyService.update(company.id, {
          name: trimmedName,
          slug: trimmedSlug,
          logoUrl: logoUrl.trim() || null,
        });
        clearDraft();
        onSuccess(updated);
      } else {
        const created = await companyService.create({
          name: trimmedName,
          slug: trimmedSlug,
          logoUrl: logoUrl.trim() || null,
        });
        clearDraft();
        onSuccess(created);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 409) {
        setSlugError(axiosError.response?.data?.error ?? t("slugTaken"));
      } else {
        setSubmitError(
          axiosError.response?.data?.error ??
            (axiosError instanceof Error ? axiosError.message : isEdit ? t("updateCompanyError") : t("createCompanyError"))
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="company-name">{t("companyName")}</Label>
        <Input
          id="company-name"
          value={name}
          onChange={handleNameChange}
          placeholder="Acme Corp"
          maxLength={NAME_MAX_LENGTH}
          autoComplete="organization"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "company-name-error" : undefined}
        />
        {nameError && (
          <p id="company-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-slug">{tCommon("slug")}</Label>
        <Input
          id="company-slug"
          value={slug}
          onChange={handleSlugChange}
          placeholder="acme-corp"
          maxLength={SLUG_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!slugError}
          aria-describedby={slugError ? "company-slug-error" : undefined}
        />
        {slugError && (
          <p id="company-slug-error" className="text-sm text-destructive">
            {slugError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-logoUrl">{t("logoUrl")}</Label>
        <Input
          id="company-logoUrl"
          type="url"
          value={logoUrl}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, logoUrl: e.target.value }))
          }
          placeholder="https://…"
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
