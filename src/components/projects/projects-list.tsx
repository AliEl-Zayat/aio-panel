"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { projectService } from "@/services/project.service";
import { organizationService } from "@/services/organization.service";
import { useCurrentOrg } from "@/contexts/current-org-context";
import type { Project, OrganizationMembership } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentControl } from "@/components/ui/segment-control";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2 } from "lucide-react";

const PROJECTS_QUERY_KEY = ["projects"] as const;

type ProjectScope = "all" | "personal" | "organization";

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

function EditProjectForm({
  project,
  onSuccess,
  onCancel,
}: Readonly<{
  project: Project;
  onSuccess: () => void;
  onCancel: () => void;
}>) {
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
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
      await projectService.update(project.id, {
        name: trimmedName,
        slug: trimmedSlug,
      });
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      if (axiosError.response?.status === 409) {
        setSlugError(
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
            setName(e.target.value);
            setNameError(validateName(e.target.value));
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
            const value = normalizeSlugInput(e.target.value);
            setSlug(value);
            setSlugError(validateSlug(value));
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

function getScopeLabel(
  project: Project,
  orgMap: Map<number, string>
): string {
  if (project.organizationId === null) return "Personal";
  return orgMap.get(project.organizationId) ?? "Organization";
}

export function ProjectsList() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrg();
  const [scope, setScope] = useState<ProjectScope>("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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

  const scopeOptions: { value: ProjectScope; label: string }[] = [
    { value: "all", label: "All" },
    { value: "personal", label: "Personal" },
  ];
  if (currentOrgName !== null) {
    scopeOptions.push({ value: "organization", label: currentOrgName });
  }

  if (isLoading) {
    return <ProjectsListSkeleton />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive mb-2">
            {error instanceof Error ? error.message : "Failed to load projects."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
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
          aria-label="Filter projects by scope"
        />
        <Button
          title="Create project"
          aria-label="Create project"
          onClick={() => {
            setActionError(null);
            /* Task 12 will wire the create project dialog */
          }}
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

      {rawProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button
              title="Create project"
              aria-label="Create project"
              onClick={() => {
                setActionError(null);
                /* Task 12 will wire the create project dialog */
              }}
            >
              <Plus className="size-4" />
              Create project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="sr-only">
            <span>Projects list</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4">Name</th>
                    <th className="text-left font-medium p-4">Slug</th>
                    <th className="text-left font-medium p-4">Scope</th>
                    <th className="text-right font-medium p-4">Actions</th>
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
                        {getScopeLabel(project, orgMap)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
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
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
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
          </CardContent>
        </Card>
      )}

      <Sheet
        open={!!editingProject}
        onOpenChange={(open) => {
          if (open) return;
          setEditingProject(null);
        }}
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

function ProjectsListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium p-4">Name</th>
                <th className="text-left font-medium p-4">Slug</th>
                <th className="text-left font-medium p-4">Scope</th>
                <th className="text-right font-medium p-4">Actions</th>
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
