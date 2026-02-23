"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { projectService } from "@/services/project.service";
import type { Project } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

const NAME_MAX_LENGTH = 200;
const SLUG_MAX_LENGTH = 100;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const PROJECTS_QUERY_KEY = (orgId: number) =>
  ["organization", orgId, "projects"] as const;

export interface OrgProjectsTabProps {
  organizationId: number;
  orgName?: string;
}

function getValidateName(tCommon: ReturnType<typeof useTranslations<"common">>) {
  return (value: string): string | null => {
    if (!value.trim()) return tCommon("nameRequired");
    if (value.length > NAME_MAX_LENGTH)
      return tCommon("nameMaxLength", { max: NAME_MAX_LENGTH });
    return null;
  };
}

function getValidateSlug(tCommon: ReturnType<typeof useTranslations<"common">>, tProjects: ReturnType<typeof useTranslations<"projects">>) {
  return (value: string): string | null => {
    if (!value.trim()) return tCommon("slugRequired");
    if (value.length > SLUG_MAX_LENGTH)
      return tCommon("slugMaxLength", { max: SLUG_MAX_LENGTH });
    if (!SLUG_REGEX.test(value)) return tProjects("slugInvalid");
    return null;
  };
}

function normalizeSlugInput(value: string): string {
  return value.toLowerCase().replaceAll(/\s+/g, "-");
}

function useProjectNameSlugFields(
  initialName: string,
  initialSlug: string,
  validateNameFn: (v: string) => string | null,
  validateSlugFn: (v: string) => string | null
) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setName(value);
      setNameError(validateNameFn(value));
    },
    [validateNameFn]
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = normalizeSlugInput(e.target.value);
      setSlug(value);
      setSlugError(validateSlugFn(value));
    },
    [validateSlugFn]
  );

  const setErrors = useCallback(
    (nErr: string | null, sErr: string | null) => {
      setNameError(nErr);
      setSlugError(sErr);
    },
    []
  );

  return {
    name,
    setName,
    slug,
    setSlug,
    nameError,
    slugError,
    setErrors,
    handleNameChange,
    handleSlugChange,
  };
}

function CreateProjectForm({
  organizationId,
  onSuccess,
  onCancel,
}: Readonly<{
  organizationId: number;
  onSuccess: () => void;
  onCancel: () => void;
}>) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const validateNameFn = useCallback(getValidateName(tCommon), [tCommon]);
  const validateSlugFn = useCallback(getValidateSlug(tCommon, t), [tCommon, t]);
  const fields = useProjectNameSlugFields("", "", validateNameFn, validateSlugFn);
  const { name, slug, nameError, slugError, setErrors, handleNameChange, handleSlugChange } =
    fields;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const nErr = validateNameFn(trimmedName);
    const sErr = validateSlugFn(trimmedSlug);
    setErrors(nErr, sErr);
    setSubmitError(null);
    if (nErr ?? sErr) return;

    setIsSubmitting(true);
    try {
      await projectService.create({
        name: trimmedName,
        slug: trimmedSlug,
        organizationId,
      });
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 409) {
        setErrors(
          null,
          axiosError.response?.data?.error ?? t("slugTaken")
        );
      } else {
        setSubmitError(
          axiosError.response?.data?.error ??
            (axiosError instanceof Error ? axiosError.message : t("createError"))
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
        <Label htmlFor="create-project-name">{tCommon("name")}</Label>
        <Input
          id="create-project-name"
          value={name}
          onChange={(e) => {
            setSubmitError(null);
            handleNameChange(e);
          }}
          placeholder="My project"
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "create-project-name-error" : undefined}
        />
        {nameError && (
          <p id="create-project-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-project-slug">{tCommon("slug")}</Label>
        <Input
          id="create-project-slug"
          value={slug}
          onChange={(e) => {
            setSubmitError(null);
            handleSlugChange(e);
          }}
          placeholder="my-project"
          maxLength={SLUG_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!slugError}
          aria-describedby={slugError ? "create-project-slug-error" : undefined}
        />
        {slugError && (
          <p id="create-project-slug-error" className="text-sm text-destructive">
            {slugError}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("creating") : t("createProject")}
        </Button>
      </div>
    </form>
  );
}

function EditProjectForm({
  project,
  onSuccess,
  onCancel,
}: Readonly<{
  project: Project;
  onSuccess: () => void;
  onCancel: () => void;
}>) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const validateNameFn = useCallback(getValidateName(tCommon), [tCommon]);
  const validateSlugFn = useCallback(getValidateSlug(tCommon, t), [tCommon, t]);
  const fields = useProjectNameSlugFields(project.name, project.slug, validateNameFn, validateSlugFn);
  const { name, slug, nameError, slugError, setErrors, handleNameChange, handleSlugChange } =
    fields;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const nErr = validateNameFn(trimmedName);
    const sErr = validateSlugFn(trimmedSlug);
    setErrors(nErr, sErr);
    setSubmitError(null);
    if (nErr ?? sErr) return;

    setIsSubmitting(true);
    try {
      await projectService.update(project.id, {
        name: trimmedName,
        slug: trimmedSlug,
      });
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 409) {
        setErrors(
          null,
          axiosError.response?.data?.error ?? t("slugTaken")
        );
      } else {
        setSubmitError(
          axiosError.response?.data?.error ??
            (axiosError instanceof Error ? axiosError.message : t("updateError"))
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
        <Label htmlFor="edit-project-name">{tCommon("name")}</Label>
        <Input
          id="edit-project-name"
          value={name}
          onChange={(e) => {
            setSubmitError(null);
            handleNameChange(e);
          }}
          placeholder="My project"
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "edit-project-name-error" : undefined}
        />
        {nameError && (
          <p id="edit-project-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-project-slug">{tCommon("slug")}</Label>
        <Input
          id="edit-project-slug"
          value={slug}
          onChange={(e) => {
            setSubmitError(null);
            handleSlugChange(e);
          }}
          placeholder="my-project"
          maxLength={SLUG_MAX_LENGTH}
          autoComplete="off"
          aria-invalid={!!slugError}
          aria-describedby={slugError ? "edit-project-slug-error" : undefined}
        />
        {slugError && (
          <p id="edit-project-slug-error" className="text-sm text-destructive">
            {slugError}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}

export function OrgProjectsTab({
  organizationId,
  orgName,
}: Readonly<OrgProjectsTabProps>) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: allOrgProjects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: PROJECTS_QUERY_KEY(organizationId),
    queryFn: async () => {
      const list = await projectService.list("organization");
      return list.filter((p) => p.organizationId === organizationId);
    },
  });

  const invalidateProjects = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY(organizationId) });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  }, [queryClient, organizationId]);

  const handleCreateSuccess = useCallback(() => {
    invalidateProjects();
    setCreateOpen(false);
  }, [invalidateProjects]);

  const handleEditSuccess = useCallback(() => {
    invalidateProjects();
    setEditingProject(null);
  }, [invalidateProjects]);

  const t = useTranslations("projects");
  const tCommon = useTranslations("common");

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <p className="text-destructive">
          {error instanceof Error ? error.message : t("loadError")}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">
          {orgName ? t("projectsInOrg", { orgName }) : t("heading")}
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setActionError(null);
            setCreateOpen(true);
          }}
          aria-label={t("create")}
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

      {allOrgProjects.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noProjectsYet")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="pb-2 pr-4 font-medium">
                  {tCommon("name")}
                </th>
                <th scope="col" className="pb-2 pr-4 font-medium">
                  {tCommon("slug")}
                </th>
                <th scope="col" className="pb-2 font-medium">
                  {tCommon("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {allOrgProjects.map((project) => (
                <tr key={project.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{project.name}</td>
                  <td className="py-2 pr-4 font-mono text-muted-foreground">
                    {project.slug}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionError(null);
                          setEditingProject(project);
                        }}
                        aria-label={`${t("edit")} ${project.name}`}
                      >
                        <Pencil className="size-4" />
                        {t("edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
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
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("orgSheetTitle")}</SheetTitle>
            <SheetDescription>{t("orgSheetDescription")}</SheetDescription>
          </SheetHeader>
          <CreateProjectForm
            organizationId={organizationId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("editSheetTitle")}</SheetTitle>
            <SheetDescription>{t("editSheetDescription")}</SheetDescription>
          </SheetHeader>
          {editingProject && (
            <EditProjectForm
              project={editingProject}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingProject(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
