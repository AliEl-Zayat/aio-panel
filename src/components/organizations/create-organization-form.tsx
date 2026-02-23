"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { organizationService } from "@/services/organization.service";
import type { Organization } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

const NAME_MAX_LENGTH = 200;
const SLUG_MAX_LENGTH = 100;
/** Lowercase, hyphenated slug; matches server rule. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface CreateOrganizationFormProps {
  readonly onSuccess: (organization: Organization) => void;
  readonly onCancel?: () => void;
}

export function CreateOrganizationForm({
  onSuccess,
  onCancel,
}: CreateOrganizationFormProps) {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
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
    setName(value);
    setNameError(validateName(value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replaceAll(/\s+/g, "-");
    setSlug(value);
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
      const organization = await organizationService.create({
        name: trimmedName,
        slug: trimmedSlug,
      });
      onSuccess(organization);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 409) {
        const message =
          axiosError.response?.data?.error ?? t("slugTaken");
        setSlugError(message);
      } else {
        const message =
          axiosError.response?.data?.error ??
          (axiosError instanceof Error ? axiosError.message : t("createError"));
        setSubmitError(message);
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
        <Label htmlFor="create-org-name">{tCommon("name")}</Label>
        <Input
          id="create-org-name"
          value={name}
          onChange={handleNameChange}
          placeholder="Acme Corp"
          maxLength={NAME_MAX_LENGTH}
          autoComplete="organization"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "create-org-name-error" : undefined}
        />
        {nameError && (
          <p id="create-org-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-org-slug">{tCommon("slug")}</Label>
        <Input
          id="create-org-slug"
          value={slug}
          onChange={handleSlugChange}
          placeholder="acme-corp"
          maxLength={SLUG_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!slugError}
          aria-describedby={slugError ? "create-org-slug-error" : undefined}
        />
        {slugError && (
          <p id="create-org-slug-error" className="text-sm text-destructive">
            {slugError}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("creating") : t("createButton")}
        </Button>
      </div>
    </form>
  );
}
