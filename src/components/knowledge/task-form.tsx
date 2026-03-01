"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { knowledgeTaskService } from "@/services/knowledge-task.service";
import type {
  KnowledgeTask,
  KnowledgeTaskStatus,
  Company,
  OrganizationMembership,
  Project,
} from "@/types/api";

const STATUS_OPTIONS: {
  value: KnowledgeTaskStatus;
  labelKey: "statusTodo" | "statusInProgress" | "statusDone" | "statusBlocked";
}[] = [
  { value: "TODO", labelKey: "statusTodo" },
  { value: "IN_PROGRESS", labelKey: "statusInProgress" },
  { value: "DONE", labelKey: "statusDone" },
  { value: "BLOCKED", labelKey: "statusBlocked" },
];
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

type LinkType = "common" | "company" | "organization" | "project";

export interface TaskFormProps {
  readonly task?: KnowledgeTask | null;
  readonly companies: Company[];
  readonly organizations: OrganizationMembership[];
  readonly projects: Project[];
  readonly onSuccess: (task: KnowledgeTask) => void;
  readonly onCancel?: () => void;
  /** When creating (no task), prefill link from this scope so user does not re-select. */
  readonly initialScope?: {
    organizationId?: number | null;
    companyId?: number | null;
    projectId?: number | null;
  };
}

function getInitialLink(
  task: KnowledgeTask | null | undefined,
  initialScope?: TaskFormProps["initialScope"]
): { type: LinkType; id: string } {
  if (task) {
    if (task.companyId != null) return { type: "company", id: String(task.companyId) };
    if (task.organizationId != null)
      return { type: "organization", id: String(task.organizationId) };
    if (task.projectId != null) return { type: "project", id: String(task.projectId) };
    return { type: "common", id: "" };
  }
  if (initialScope?.projectId != null)
    return { type: "project", id: String(initialScope.projectId) };
  if (initialScope?.organizationId != null)
    return { type: "organization", id: String(initialScope.organizationId) };
  if (initialScope?.companyId != null)
    return { type: "company", id: String(initialScope.companyId) };
  return { type: "common", id: "" };
}

export function TaskForm({
  task,
  companies,
  organizations,
  projects,
  onSuccess,
  onCancel,
  initialScope,
}: TaskFormProps) {
  const t = useTranslations("knowledge");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const isEdit = task !== undefined && task !== null;
  const initial = getInitialLink(task, initialScope);
  const [title, setTitle] = useState(task?.title ?? "");
  const [body, setBody] = useState(task?.body ?? "");
  const [status, setStatus] = useState<KnowledgeTaskStatus>(task?.status ?? "TODO");
  const [linkType, setLinkType] = useState<LinkType>(initial.type);
  const [linkId, setLinkId] = useState(initial.id);
  const [blockageReason, setBlockageReason] = useState(task?.blockageReason ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = getInitialLink(task, initialScope);
    setTitle(task?.title ?? "");
    setBody(task?.body ?? "");
    setStatus(task?.status ?? "TODO");
    setLinkType(init.type);
    setLinkId(init.id);
    setBlockageReason(task?.blockageReason ?? "");
  }, [task, initialScope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(t("titleRequired"));
      return;
    }
    setTitleError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    const numId = linkId ? Number(linkId) : null;
    const companyId = linkType === "company" && numId ? numId : null;
    const organizationId =
      linkType === "organization" && numId ? numId : null;
    const projectId = linkType === "project" && numId ? numId : null;

    try {
      const blockage =
        status === "BLOCKED" ? (blockageReason.trim() || null) : null;
      if (isEdit) {
        const updated = await knowledgeTaskService.update(task!.id, {
          title: trimmedTitle,
          body: body.trim() || null,
          status,
          companyId,
          organizationId,
          projectId,
          blockageReason: blockage,
        });
        onSuccess(updated);
      } else {
        const created = await knowledgeTaskService.create({
          title: trimmedTitle,
          body: body.trim() || null,
          status,
          companyId,
          organizationId,
          projectId,
          blockageReason: blockage,
        });
        onSuccess(created);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const fallback = isEdit ? t("updateTaskError") : t("createTaskError");
      setSubmitError(
        axiosError.response?.data?.error ??
          (axiosError instanceof Error ? axiosError.message : fallback)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSecondSelect =
    linkType === "company" ||
    linkType === "organization" ||
    linkType === "project";
  const options =
    linkType === "company"
      ? companies
      : linkType === "organization"
        ? organizations
        : linkType === "project"
          ? projects
          : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="task-title">{t("taskTitle")}</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) setTitleError(null);
          }}
          placeholder="Task title"
          maxLength={500}
          aria-invalid={!!titleError}
          aria-describedby={titleError ? "task-title-error" : undefined}
        />
        {titleError && (
          <p id="task-title-error" className="text-sm text-destructive">
            {titleError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-body">{t("taskBody")}</Label>
        <textarea
          id="task-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Optional notes"
          rows={3}
          maxLength={5000}
          className={cn(
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-status">{t("status")}</Label>
        <select
          id="task-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as KnowledgeTaskStatus)}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background/80 backdrop-blur-sm px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>
      {status === "BLOCKED" && (
        <div className="space-y-2">
          <Label htmlFor="task-blockage-reason">{t("blockageReason")}</Label>
          <textarea
            id="task-blockage-reason"
            value={blockageReason}
            onChange={(e) => setBlockageReason(e.target.value)}
            placeholder={t("blockageReasonPlaceholder")}
            rows={2}
            className={cn(
              "flex w-full rounded-md border border-input bg-background/80 backdrop-blur-sm px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm resize-none"
            )}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>{t("linkTo")}</Label>
        <select
          value={linkType}
          onChange={(e) => {
            const v = e.target.value as LinkType;
            setLinkType(v);
            setLinkId("");
          }}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          )}
        >
          <option value="common">{t("common")}</option>
          <option value="company">{t("companies")}</option>
          <option value="organization">{tNav("organizations")}</option>
          <option value="project">{tNav("projects")}</option>
        </select>
      </div>
      {showSecondSelect && options.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="task-link-id">
            {linkType === "company"
              ? t("company")
              : linkType === "organization"
                ? tNav("organizations")
                : tNav("projects")}
          </Label>
          <select
            id="task-link-id"
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            )}
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.id} value={String(o.id)}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}
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
