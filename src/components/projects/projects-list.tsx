"use client";

import { useState, useCallback } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectForm } from "@/components/projects/project-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

const PROJECTS_QUERY_KEY = ["projects"] as const;

type ProjectScope = "all" | "personal" | "organization";

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
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
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

  const handleCreateSuccess = useCallback(() => {
    invalidateProjects();
    setCreateSheetOpen(false);
  }, [invalidateProjects]);

  const handleDelete = async (project: Project) => {
    const confirmed = globalThis.confirm(
      `Are you sure you want to delete the project "${project.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await projectService.remove(project.id);
      setActionError(null);
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
            setCreateSheetOpen(true);
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
                setCreateSheetOpen(true);
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
        open={createSheetOpen || !!editingProject}
        onOpenChange={(open) => {
          if (!open) {
            setCreateSheetOpen(false);
            setEditingProject(null);
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{createSheetOpen ? "Create project" : "Edit project"}</SheetTitle>
            <SheetDescription>
              {createSheetOpen
                ? "Create a new project under your personal account or an organization. Slug must be unique."
                : "Update the project name and slug. Slug must be unique."}
            </SheetDescription>
          </SheetHeader>
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
