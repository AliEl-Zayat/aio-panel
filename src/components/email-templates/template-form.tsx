"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { emailTemplateService } from "@/services/email-template.service";
import type { EmailTemplate, OrganizationMembership, Project } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";

export interface TemplateFormProps {
  readonly template?: EmailTemplate | null;
  readonly organizations: OrganizationMembership[];
  readonly projects: Project[];
  readonly onSuccess: (template: EmailTemplate) => void;
  readonly onCancel?: () => void;
}

export function TemplateForm({
  template,
  organizations,
  projects,
  onSuccess,
  onCancel,
}: TemplateFormProps) {
  const t = useTranslations("emailTemplates");
  const tCommon = useTranslations("common");
  const isEdit = template != null;
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [scope, setScope] = useState<"personal" | "org" | "project">(
    template?.organizationId != null ? "org" : template?.projectId != null ? "project" : "personal"
  );
  const [organizationId, setOrganizationId] = useState<number | null>(
    template?.organizationId ?? null
  );
  const [projectId, setProjectId] = useState<number | null>(template?.projectId ?? null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(template?.name ?? "");
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
    setScope(
      template?.organizationId != null
        ? "org"
        : template?.projectId != null
          ? "project"
          : "personal"
    );
    setOrganizationId(template?.organizationId ?? null);
    setProjectId(template?.projectId ?? null);
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();
    if (!trimmedName) {
      setNameError(tCommon("nameRequired"));
      return;
    }
    if (!trimmedSubject) {
      setSubmitError(t("subject") + " is required.");
      return;
    }
    setNameError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (isEdit) {
        const updated = await emailTemplateService.update(template.id, {
          name: trimmedName,
          subject: trimmedSubject,
          body: body,
        });
        onSuccess(updated);
      } else {
        const orgId =
          scope === "org" && organizationId != null ? organizationId : undefined;
        const projId =
          scope === "project" && projectId != null ? projectId : undefined;
        const created = await emailTemplateService.create({
          name: trimmedName,
          subject: trimmedSubject,
          body,
          organizationId: orgId ?? null,
          projectId: projId ?? null,
        });
        onSuccess(created);
      }
    } catch (err) {
      const msg =
        err instanceof AxiosError && err.response?.data?.error
          ? String(err.response.data.error)
          : isEdit
            ? t("updateError")
            : t("createError");
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">{t("name")}</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("name")}
          maxLength={200}
          aria-invalid={!!nameError}
        />
        {nameError && (
          <p className="text-sm text-destructive" role="alert">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-subject">{t("subject")}</Label>
        <Input
          id="template-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("subject")}
          maxLength={500}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-body">{t("body")}</Label>
        <textarea
          id="template-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("body")}
          rows={6}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          )}
        />
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
                setOrganizationId(e.target.value ? Number(e.target.value) : null)
              }
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
