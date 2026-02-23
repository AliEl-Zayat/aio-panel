"use client";

import { useState, useCallback } from "react";
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

function useProjectNameSlugFields(initialName: string, initialSlug: string) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setName(value);
      setNameError(validateName(value));
    },
    []
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = normalizeSlugInput(e.target.value);
      setSlug(value);
      setSlugError(validateSlug(value));
    },
    []
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
  const fields = useProjectNameSlugFields("", "");
  const { name, slug, nameError, slugError, setErrors, handleNameChange, handleSlugChange } =
    fields;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const nErr = validateName(trimmedName);
    const sErr = validateSlug(trimmedSlug);
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
          axiosError.response?.data?.error ?? "This slug is already taken."
        );
      } else {
        setSubmitError(
          axiosError.response?.data?.error ??
            (axiosError instanceof Error ? axiosError.message : "Failed to create project.")
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
        <Label htmlFor="create-project-name">Name</Label>
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
        <Label htmlFor="create-project-slug">Slug</Label>
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
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create project"}
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
  const fields = useProjectNameSlugFields(project.name, project.slug);
  const { name, slug, nameError, slugError, setErrors, handleNameChange, handleSlugChange } =
    fields;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const nErr = validateName(trimmedName);
    const sErr = validateSlug(trimmedSlug);
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
          axiosError.response?.data?.error ?? "This slug is already taken."
        );
      } else {
        setSubmitError(
          axiosError.response?.data?.error ??
            (axiosError instanceof Error ? axiosError.message : "Failed to update project.")
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
        <Label htmlFor="edit-project-name">Name</Label>
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
        <Label htmlFor="edit-project-slug">Slug</Label>
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
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
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

  const handleDelete = async (project: Project) => {
    const confirmed = globalThis.confirm(
      `Are you sure you want to delete the project "${project.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await projectService.remove(project.id);
      invalidateProjects();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setActionError(
        axiosError.response?.data?.error ?? "Failed to delete project."
      );
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
          {error instanceof Error ? error.message : "Failed to load projects."}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">
          Projects{orgName ? ` in ${orgName}` : ""}
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setActionError(null);
            setCreateOpen(true);
          }}
          aria-label="Create project"
        >
          <Plus className="size-4" />
          Create project
        </Button>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}

      {allOrgProjects.length === 0 ? (
        <p className="text-muted-foreground text-sm">No projects yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="pb-2 pr-4 font-medium">
                  Name
                </th>
                <th scope="col" className="pb-2 pr-4 font-medium">
                  Slug
                </th>
                <th scope="col" className="pb-2 font-medium">
                  Actions
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
                        aria-label={`Edit ${project.name}`}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(project)}
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2 className="size-4" />
                        Delete
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
            <SheetTitle>Create project</SheetTitle>
            <SheetDescription>
              Add a new project to this organization. Slug must be unique.
            </SheetDescription>
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
            <SheetTitle>Edit project</SheetTitle>
            <SheetDescription>
              Update the project name and slug. Slug must be unique.
            </SheetDescription>
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
