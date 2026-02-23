"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { projectService } from "@/services/project.service";
import type { Project, OrganizationMembership } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NAME_MAX_LENGTH = 200;
const SLUG_MAX_LENGTH = 100;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateName(value: string): string | null {
  if (!value.trim()) return "Name is required.";
  if (value.length > NAME_MAX_LENGTH)
    return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
  return null;
}

function validateSlug(value: string): string | null {
  if (!value.trim()) return "Slug is required.";
  if (value.length > SLUG_MAX_LENGTH)
    return `Slug must be at most ${SLUG_MAX_LENGTH} characters.`;
  if (!SLUG_REGEX.test(value))
    return "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-project).";
  return null;
}

function normalizeSlugInput(value: string): string {
  return value.toLowerCase().replaceAll(/\s+/g, "-");
}

export type ProjectFormCreateProps = {
  mode: "create";
  organizations: OrganizationMembership[];
  defaultOrganizationId: number | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export type ProjectFormEditProps = {
  mode: "edit";
  project: Project;
  onSuccess: () => void;
  onCancel: () => void;
};

export type ProjectFormProps = ProjectFormCreateProps | ProjectFormEditProps;

function getInitialOrganizationId(props: ProjectFormProps): string {
  if (props.mode !== "create") return "personal";
  const id = props.defaultOrganizationId;
  return id === null ? "personal" : String(id);
}

export function ProjectForm(props: ProjectFormProps) {
  const isCreate = props.mode === "create";

  const [name, setName] = useState(isCreate ? "" : props.project.name);
  const [slug, setSlug] = useState(isCreate ? "" : props.project.slug);
  const [organizationId, setOrganizationId] = useState<string>(
    getInitialOrganizationId(props)
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const nErr = validateName(trimmedName);
    const sErr = validateSlug(trimmedSlug);
    setNameError(nErr);
    setSlugError(sErr);
    setSubmitError(null);
    if (nErr ?? sErr) return;

    setIsSubmitting(true);
    try {
      if (isCreate) {
        await projectService.create({
          name: trimmedName,
          slug: trimmedSlug,
          organizationId:
            organizationId === "personal"
              ? undefined
              : Number.parseInt(organizationId, 10),
        });
      } else {
        await projectService.update(props.project.id, {
          name: trimmedName,
          slug: trimmedSlug,
        });
      }
      props.onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 409) {
        setSlugError(
          axiosError.response?.data?.error ?? "This slug is already taken."
        );
      } else {
        setSubmitError(
          axiosError.response?.data?.error ??
            (err instanceof Error ? err.message : "Something went wrong.")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formId = isCreate ? "create-project" : "edit-project";
  const submittingLabel = isCreate ? "Creating…" : "Saving…";
  const submitLabel = isCreate ? "Create project" : "Save";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      {isCreate && (
        <div className="space-y-2">
          <Label htmlFor={`${formId}-organization`}>Organization</Label>
          <select
            id={`${formId}-organization`}
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-describedby={`${formId}-organization-description`}
          >
            <option value="personal">Personal</option>
            {props.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <p id={`${formId}-organization-description`} className="text-xs text-muted-foreground">
            Create under your personal account or an organization.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input
          id={`${formId}-name`}
          value={name}
          onChange={(e) => {
            setSubmitError(null);
            setName(e.target.value);
            setNameError(validateName(e.target.value));
          }}
          placeholder="My project"
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? `${formId}-name-error` : undefined}
        />
        {nameError && (
          <p id={`${formId}-name-error`} className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-slug`}>Slug</Label>
        <Input
          id={`${formId}-slug`}
          value={slug}
          onChange={(e) => {
            setSubmitError(null);
            const value = normalizeSlugInput(e.target.value);
            setSlug(value);
            setSlugError(validateSlug(value));
          }}
          placeholder="my-project"
          maxLength={SLUG_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!slugError}
          aria-describedby={slugError ? `${formId}-slug-error` : undefined}
        />
        {slugError && (
          <p id={`${formId}-slug-error`} className="text-sm text-destructive">
            {slugError}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={props.onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
