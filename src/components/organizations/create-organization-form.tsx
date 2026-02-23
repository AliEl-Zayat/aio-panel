"use client";

import { useState, useCallback } from "react";
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
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = useCallback((value: string): string | null => {
    if (!value.trim()) return "Name is required.";
    if (value.length > NAME_MAX_LENGTH)
      return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
    return null;
  }, []);

  const validateSlug = useCallback((value: string): string | null => {
    if (!value.trim()) return "Slug is required.";
    if (value.length > SLUG_MAX_LENGTH)
      return `Slug must be at most ${SLUG_MAX_LENGTH} characters.`;
    if (!SLUG_REGEX.test(value))
      return "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-org).";
    return null;
  }, []);

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
          axiosError.response?.data?.error ?? "This slug is already taken.";
        setSlugError(message);
      } else {
        setSlugError(
          axiosError.response?.data?.error ??
            (axiosError instanceof Error ? axiosError.message : "Failed to create organization.")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="create-org-name">Name</Label>
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
        <Label htmlFor="create-org-slug">Slug</Label>
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
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
}
