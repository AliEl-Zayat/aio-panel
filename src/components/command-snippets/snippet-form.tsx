"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { commandSnippetService } from "@/services/command-snippet.service";
import type {
  CommandSnippet,
  OrganizationMembership,
  Project,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";

const NAME_MAX_LENGTH = 200;
const CONTENT_MAX_LENGTH = 50_000;

function getScopeFromSnippet(s: CommandSnippet | null | undefined): "personal" | "org" | "project" {
  if (s?.organizationId != null) return "org";
  if (s?.projectId != null) return "project";
  return "personal";
}

export interface SnippetFormProps {
  readonly snippet?: CommandSnippet | null;
  readonly organizations: OrganizationMembership[];
  readonly projects: Project[];
  readonly onSuccess: (snippet: CommandSnippet) => void;
  readonly onCancel?: () => void;
}

export function SnippetForm({
  snippet,
  organizations,
  projects,
  onSuccess,
  onCancel,
}: SnippetFormProps) {
  const t = useTranslations("commandSnippets");
  const tCommon = useTranslations("common");
  const isEdit = snippet != null;

  const [name, setName] = useState(snippet?.name ?? "");
  const [content, setContent] = useState(snippet?.content ?? "");
  const [type, setType] = useState<"COMMAND" | "TEXT">(
    snippet?.type ?? "COMMAND"
  );
  const [scope, setScope] = useState<"personal" | "org" | "project">(
    getScopeFromSnippet(snippet)
  );
  const [organizationId, setOrganizationId] = useState<number | null>(
    snippet?.organizationId ?? null
  );
  const [projectId, setProjectId] = useState<number | null>(
    snippet?.projectId ?? null
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (snippet === null || snippet === undefined) return;
    setName(snippet.name);
    setContent(snippet.content);
    setType(snippet.type);
    setScope(getScopeFromSnippet(snippet));
    setOrganizationId(snippet.organizationId ?? null);
    setProjectId(snippet.projectId ?? null);
  }, [snippet]);

  const getSubmitErrorMessage = (err: unknown): string => {
    if (err instanceof AxiosError && err.response?.data?.error) {
      return String(err.response.data.error);
    }
    return isEdit ? t("updateError") : t("createError");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    setNameError(null);
    setContentError(null);
    setSubmitError(null);

    if (trimmedName.length === 0) {
      setNameError(tCommon("nameRequired"));
      return;
    }
    if (trimmedName.length > NAME_MAX_LENGTH) {
      setNameError(tCommon("nameMaxLength", { max: NAME_MAX_LENGTH }));
      return;
    }
    if (trimmedContent.length === 0) {
      setContentError(t("contentRequired"));
      return;
    }
    if (trimmedContent.length > CONTENT_MAX_LENGTH) {
      setContentError(t("contentMaxLength", { max: CONTENT_MAX_LENGTH }));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && snippet) {
        const updated = await commandSnippetService.update(snippet.id, {
          name: trimmedName,
          content: trimmedContent,
          type,
        });
        onSuccess(updated);
        return;
      }
      const orgId = scope === "org" ? organizationId ?? undefined : undefined;
      const projId = scope === "project" ? projectId ?? undefined : undefined;
      const created = await commandSnippetService.create({
        name: trimmedName,
        content: trimmedContent,
        type,
        organizationId: orgId ?? null,
        projectId: projId ?? null,
      });
      onSuccess(created);
    } catch (err) {
      setSubmitError(getSubmitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="snippet-name">{t("name")}</Label>
        <Input
          id="snippet-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("name")}
          maxLength={NAME_MAX_LENGTH}
          aria-invalid={!!nameError}
        />
        {nameError && (
          <p className="text-sm text-destructive" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="snippet-content">{t("content")}</Label>
        <textarea
          id="snippet-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("content")}
          rows={6}
          maxLength={CONTENT_MAX_LENGTH}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          )}
          aria-invalid={!!contentError}
        />
        {contentError && (
          <p className="text-sm text-destructive" role="alert">
            {contentError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("type")}</Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="snippet-type"
              checked={type === "COMMAND"}
              onChange={() => setType("COMMAND")}
            />
            {t("typeCommand")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="snippet-type"
              checked={type === "TEXT"}
              onChange={() => setType("TEXT")}
            />
            {t("typeText")}
          </label>
        </div>
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label>{t("scope")}</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                checked={scope === "personal"}
                onChange={() => {
                  setScope("personal");
                  setOrganizationId(null);
                  setProjectId(null);
                }}
              />
              {t("scopePersonal")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                checked={scope === "org"}
                onChange={() => {
                  setScope("org");
                  setProjectId(null);
                  setOrganizationId(organizations[0]?.id ?? null);
                }}
              />
              {t("scopeOrg")}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="scope"
                checked={scope === "project"}
                onChange={() => {
                  setScope("project");
                  setOrganizationId(null);
                  setProjectId(projects[0]?.id ?? null);
                }}
              />
              {t("scopeProject")}
            </label>
          </div>
          {scope === "org" && organizations.length > 0 && (
            <select
              className="mt-2 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={organizationId ?? ""}
              onChange={(e) =>
                setOrganizationId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              aria-label={t("scopeOrg")}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}
          {scope === "project" && projects.length > 0 && (
            <select
              className="mt-2 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={projectId ?? ""}
              onChange={(e) =>
                setProjectId(e.target.value ? Number(e.target.value) : null)
              }
              aria-label={t("scopeProject")}
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

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
