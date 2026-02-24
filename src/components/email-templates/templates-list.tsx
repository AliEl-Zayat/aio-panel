"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { emailTemplateService, type EmailTemplateListParams } from "@/services/email-template.service";
import { organizationService } from "@/services/organization.service";
import { projectService } from "@/services/project.service";
import type { EmailTemplate } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TemplateForm } from "./template-form";
import { Plus, Pencil, Trash2, Mail } from "lucide-react";
import Link from "next/link";

const TEMPLATES_QUERY_KEY = ["email-templates"] as const;
const ORGANIZATIONS_QUERY_KEY = ["organizations"] as const;
const PROJECTS_QUERY_KEY = ["projects"] as const;

function getScopeLabel(
  template: EmailTemplate,
  t: ReturnType<typeof useTranslations<"emailTemplates">>
): string {
  if (template.organization?.name) return template.organization.name;
  if (template.project?.name) return template.project.name;
  return t("scopePersonal");
}

export function TemplatesList() {
  const t = useTranslations("emailTemplates");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"all" | "personal">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const listParams = useMemo((): EmailTemplateListParams | undefined => {
    if (scope === "personal") return { scope: "personal" };
    return undefined;
  }, [scope]);

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: [...TEMPLATES_QUERY_KEY, listParams],
    queryFn: () => emailTemplateService.list(listParams),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: () => organizationService.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => projectService.list("all"),
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    setEditingTemplate(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await emailTemplateService.remove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={scope === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("all")}
          >
            {t("scopeAll")}
          </Button>
          <Button
            variant={scope === "personal" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("personal")}
          >
            {t("scopePersonal")}
          </Button>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="me-2 size-4" />
          {t("add")}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t("loadError")} {tCommon("retry")}
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              {t("add")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{template.name}</p>
                    <p className="text-muted-foreground text-sm truncate">
                      {template.subject}
                    </p>
                    <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs">
                      {getScopeLabel(template, t)}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/email-templates/${template.id}/compose`}>
                        <Mail className="size-4" aria-label={t("use")} />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTemplate(template)}
                      aria-label={t("edit")}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(template)}
                      aria-label={t("delete")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("createTemplate")}</SheetTitle>
            <SheetDescription>
              Add a new email template. Use {"{{placeholder}}"} in subject and body.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TemplateForm
              organizations={organizations}
              projects={projects}
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editingTemplate != null} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("editTemplate")}</SheetTitle>
            <SheetDescription>Update name, subject, or body.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {editingTemplate && (
              <TemplateForm
                template={editingTemplate}
                organizations={organizations}
                projects={projects}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingTemplate(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
