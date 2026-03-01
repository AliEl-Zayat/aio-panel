"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { projectService } from "@/services/project.service";
import { organizationService } from "@/services/organization.service";
import { useCurrentOrg } from "@/contexts/current-org-context";
import type { Project, OrganizationMembership } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentControl } from "@/components/ui/segment-control";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { ProjectForm } from "@/components/projects/project-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

const PROJECTS_QUERY_KEY = ["projects"] as const;

type ProjectScope = "all" | "personal" | "organization";

function getScopeLabel(
  project: Project,
  orgMap: Map<number, string>,
  scopePersonal: string,
  scopeOrg: string
): string {
  if (project.organizationId === null) return scopePersonal;
  return orgMap.get(project.organizationId) ?? scopeOrg;
}

export function ProjectsList() {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrg();
  const [scope, setScope] = useState<ProjectScope>("all");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationService.list(),
  });

  const orgMap = new Map<number, string>(
    organizations.map((o: OrganizationMembership) => [o.id, o.name])
  );
  const currentOrgName =
    currentOrganizationId === null
      ? null
      : orgMap.get(currentOrganizationId) ?? null;

  const effectiveScope: ProjectScope =
    scope === "organization" && currentOrganizationId === null ? "all" : scope;

  const {
    data: rawProjects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, effectiveScope, currentOrganizationId ?? 0],
    queryFn: async () => {
      const list = await projectService.list(effectiveScope);
      if (effectiveScope === "organization" && currentOrganizationId !== null) {
        return list.filter((p) => p.organizationId === currentOrganizationId);
      }
      return list;
    },
  });

  const invalidateProjects = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
  }, [queryClient]);

  const handleEditSuccess = useCallback(() => {
    invalidateProjects();
    setEditingProject(null);
  }, [invalidateProjects]);

  const handleCreateSuccess = useCallback(() => {
    invalidateProjects();
    setCreateSheetOpen(false);
  }, [invalidateProjects]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await projectService.remove(deleteTarget.id);
      invalidateProjects();
      setDeleteTarget(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setActionError(
        axiosError.response?.data?.error ?? t("deleteError")
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const scopeOptions: { value: ProjectScope; label: string }[] = [
    { value: "all", label: t("scopeAll") },
    { value: "personal", label: t("scopePersonal") },
  ];
  if (currentOrgName !== null) {
    scopeOptions.push({ value: "organization", label: currentOrgName });
  }

  if (isLoading) {
    return <ProjectsListSkeleton t={t} tCommon={tCommon} />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive mb-2">
            {error instanceof Error ? error.message : t("loadError")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {tCommon("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentControl<ProjectScope>
          value={effectiveScope}
          options={scopeOptions}
          onValueChange={(v) => setScope(v)}
          aria-label={t("filterByScope")}
        />
        <Button
          title={t("create")}
          aria-label={t("create")}
          onClick={() => {
            setActionError(null);
            setEditingProject(null);
            setCreateSheetOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t("create")}
        </Button>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? t("deleteConfirm", { name: deleteTarget.name })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {rawProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">{t("noProjectsYet")}</p>
            <Button
              title={t("create")}
              aria-label={t("create")}
              onClick={() => {
                setActionError(null);
                setEditingProject(null);
                setCreateSheetOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("create")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="sr-only">
            <span>{t("listTitle")}</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4">{tCommon("name")}</th>
                    <th className="text-left font-medium p-4">{tCommon("slug")}</th>
                    <th className="text-left font-medium p-4">{t("scope")}</th>
                    <th className="text-right font-medium p-4">{tCommon("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rawProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="p-4 font-medium">{project.name}</td>
                      <td className="p-4 text-muted-foreground font-mono">
                        {project.slug}
                      </td>
                      <td className="p-4">
                        {getScopeLabel(project, orgMap, t("scopePersonal"), t("scopeOrg"))}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActionError(null);
                              setCreateSheetOpen(false);
                              setEditingProject(project);
                            }}
                            aria-label={`${t("edit")} ${project.name}`}
                          >
                            <Pencil className="size-4" />
                            {t("edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setActionError(null);
                              setDeleteTarget(project);
                            }}
                            aria-label={`${t("delete")} ${project.name}`}
                          >
                            <Trash2 className="size-4" />
                            {t("delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={createSheetOpen || !!editingProject}
        onOpenChange={(open) => {
          if (!open) {
            setCreateSheetOpen(false);
            setEditingProject(null);
          }
        }}
      >
        <DialogContent className="overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{createSheetOpen ? t("create") : t("edit")}</DialogTitle>
            <DialogDescription>
              {createSheetOpen ? t("createDescription") : t("editDescription")}
            </DialogDescription>
          </DialogHeader>
          {createSheetOpen && (
            <ProjectForm
              mode="create"
              organizations={organizations}
              defaultOrganizationId={currentOrganizationId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateSheetOpen(false)}
            />
          )}
          {!createSheetOpen && editingProject && (
            <ProjectForm
              mode="edit"
              project={editingProject}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingProject(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectsListSkeleton({
  t,
  tCommon,
}: Readonly<{
  t: ReturnType<typeof useTranslations<"projects">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}>) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium p-4">{tCommon("name")}</th>
                <th className="text-left font-medium p-4">{tCommon("slug")}</th>
                <th className="text-left font-medium p-4">{t("scope")}</th>
                <th className="text-right font-medium p-4">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="p-4">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-5 w-24" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className="p-4 text-right">
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
