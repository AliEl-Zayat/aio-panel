"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/organization.service";
import type { Organization } from "@/types/api";
import { SegmentControl } from "@/components/ui/segment-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AxiosError } from "axios";

const NAME_MAX_LENGTH = 200;
const SLUG_MAX_LENGTH = 100;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type OrgDetailTab = "details" | "members" | "projects";

export interface OrgDetailTabsProps {
  organization: Organization;
  organizationId: number;
  currentUserRole: string | null;
}

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
    return "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-org).";
  return null;
}

function DetailsTabContent({
  organization,
  organizationId,
  isAdmin,
}: Readonly<{
  organization: Organization;
  organizationId: number;
  isAdmin: boolean;
}>) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const startEdit = useCallback(() => {
    setName(organization.name);
    setSlug(organization.slug);
    setNameError(null);
    setSlugError(null);
    setEditing(true);
  }, [organization.name, organization.slug]);

  const cancelEdit = useCallback(() => {
    setName(organization.name);
    setSlug(organization.slug);
    setNameError(null);
    setSlugError(null);
    setEditing(false);
  }, [organization.name, organization.slug]);

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
      await organizationService.update(organizationId, {
        name: trimmedName,
        slug: trimmedSlug,
      });
      await queryClient.invalidateQueries({ queryKey: ["organization", organizationId] });
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setEditing(false);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 409) {
        setSlugError(
          axiosError.response?.data?.error ?? "This slug is already taken."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="org-edit-name">Name</Label>
          <Input
            id="org-edit-name"
            value={name}
            onChange={handleNameChange}
            placeholder="Acme Corp"
            maxLength={NAME_MAX_LENGTH}
            autoComplete="organization"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "org-edit-name-error" : undefined}
          />
          {nameError && (
            <p id="org-edit-name-error" className="text-sm text-destructive">
              {nameError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-edit-slug">Slug</Label>
          <Input
            id="org-edit-slug"
            value={slug}
            onChange={handleSlugChange}
            placeholder="acme-corp"
            maxLength={SLUG_MAX_LENGTH}
            autoComplete="off"
            aria-invalid={!!slugError}
            aria-describedby={slugError ? "org-edit-slug-error" : undefined}
          />
          {slugError && (
            <p id="org-edit-slug-error" className="text-sm text-destructive">
              {slugError}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Name</dt>
          <dd>{organization.name}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Slug</dt>
          <dd>{organization.slug}</dd>
        </div>
      </dl>
      {isAdmin && (
        <Button type="button" variant="outline" size="sm" onClick={startEdit}>
          Edit
        </Button>
      )}
    </div>
  );
}

function MembersTabPlaceholder() {
  return (
    <p className="text-muted-foreground text-sm">Members tab — coming soon.</p>
  );
}

function ProjectsTabPlaceholder() {
  return (
    <p className="text-muted-foreground text-sm">Projects tab — coming soon.</p>
  );
}

export function OrgDetailTabs({
  organization,
  organizationId,
  currentUserRole,
}: Readonly<OrgDetailTabsProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: OrgDetailTab =
    tabParam === "members" || tabParam === "projects" ? tabParam : "details";

  const setTab = useCallback(
    (value: OrgDetailTab) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "details") {
        next.delete("tab");
      } else {
        next.set("tab", value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const isAdmin = currentUserRole === "ADMIN";

  return (
    <div className="space-y-4">
      <SegmentControl<OrgDetailTab>
        aria-label="Organization sections"
        value={tab}
        options={[
          { value: "details", label: "Details" },
          { value: "members", label: "Members" },
          { value: "projects", label: "Projects" },
        ]}
        onValueChange={setTab}
      />
      <Card>
        <CardContent className="pt-6">
          {tab === "details" && (
            <DetailsTabContent
              organization={organization}
              organizationId={organizationId}
              isAdmin={isAdmin}
            />
          )}
          {tab === "members" && <MembersTabPlaceholder />}
          {tab === "projects" && <ProjectsTabPlaceholder />}
        </CardContent>
      </Card>
    </div>
  );
}
