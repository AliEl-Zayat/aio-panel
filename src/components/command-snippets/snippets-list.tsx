"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  commandSnippetService,
  type CommandSnippetListParams,
} from "@/services/command-snippet.service";
import { organizationService } from "@/services/organization.service";
import { projectService } from "@/services/project.service";
import type { CommandSnippet } from "@/types/api";
import { useCurrentOrg } from "@/contexts/current-org-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { SnippetForm } from "./snippet-form";
import { Plus, Pencil, Trash2, Copy, Search } from "lucide-react";

const SNIPPETS_QUERY_KEY = ["command-snippets"] as const;
const ORGANIZATIONS_QUERY_KEY = ["organizations"] as const;
const PROJECTS_QUERY_KEY = ["projects"] as const;

const CONTENT_PREVIEW_MAX = 80;

function getScopeLabel(
  snippet: CommandSnippet,
  t: ReturnType<typeof useTranslations<"commandSnippets">>
): string {
  if (snippet.organization?.name) return snippet.organization.name;
  if (snippet.project?.name) return snippet.project.name;
  return t("scopePersonal");
}

function contentPreview(content: string): string {
  const first = content.split(/\r?\n/)[0] ?? "";
  if (first.length <= CONTENT_PREVIEW_MAX) return first;
  return first.slice(0, CONTENT_PREVIEW_MAX) + "…";
}

export function SnippetsList() {
  const t = useTranslations("commandSnippets");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrg();

  const [typeFilter, setTypeFilter] = useState<"all" | "COMMAND" | "TEXT">("all");
  const [scopeFilter, setScopeFilter] = useState<
    "all" | "personal" | "org" | "project"
  >("all");
  const [projectIdForFilter, setProjectIdForFilter] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CommandSnippet | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<CommandSnippet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const listParams = useMemo((): CommandSnippetListParams | undefined => {
    const params: CommandSnippetListParams = {};
    if (typeFilter !== "all") params.type = typeFilter;
    if (scopeFilter === "personal") {
      return { ...params, scope: "personal" };
    }
    if (scopeFilter === "org" && currentOrganizationId != null) {
      return { ...params, organizationId: currentOrganizationId };
    }
    if (scopeFilter === "project" && projectIdForFilter != null) {
      return { ...params, projectId: projectIdForFilter };
    }
    return Object.keys(params).length > 0 ? params : undefined;
  }, [typeFilter, scopeFilter, currentOrganizationId, projectIdForFilter]);

  const { data: snippets = [], isLoading, error } = useQuery({
    queryKey: [...SNIPPETS_QUERY_KEY, listParams],
    queryFn: () => commandSnippetService.list(listParams),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: () => organizationService.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => projectService.list("all"),
    enabled: scopeFilter === "project" || createOpen,
  });

  const filteredSnippets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  }, [snippets, searchQuery]);

  const emptyStateMessage =
    snippets.length === 0 ? t("empty") : t("noResults");

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
    setEditingSnippet(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await commandSnippetService.remove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async (snippet: CommandSnippet) => {
    try {
      await navigator.clipboard.writeText(snippet.content);
      setCopiedId(snippet.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // copyError shown via aria or toast if we add one
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
            >
              {t("scopeAll")}
            </Button>
            <Button
              variant={typeFilter === "COMMAND" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("COMMAND")}
            >
              {t("typeCommand")}
            </Button>
            <Button
              variant={typeFilter === "TEXT" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("TEXT")}
            >
              {t("typeText")}
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant={scopeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("all")}
            >
              {t("scopeAll")}
            </Button>
            <Button
              variant={scopeFilter === "personal" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("personal")}
            >
              {t("scopePersonal")}
            </Button>
            <Button
              variant={scopeFilter === "org" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("org")}
              disabled={currentOrganizationId == null}
            >
              {t("scopeOrg")}
            </Button>
            <Button
              variant={scopeFilter === "project" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("project")}
            >
              {t("scopeProject")}
            </Button>
          </div>
          {scopeFilter === "project" && projects.length > 0 && (
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={projectIdForFilter ?? ""}
              onChange={(e) =>
                setProjectIdForFilter(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              aria-label={t("scopeProject")}
            >
              <option value="">{t("scopeProject")}</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-8"
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="me-2 size-4" />
            {t("add")}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t("loadError")} {tCommon("retry")}
        </p>
      )}

      {(() => {
        if (isLoading) return <Skeleton className="h-32 w-full" />;
        if (filteredSnippets.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">{emptyStateMessage}</p>
                {snippets.length === 0 && (
                  <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                    {t("add")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSnippets.map((snippet) => (
              <Card key={snippet.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{snippet.name}</p>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {contentPreview(snippet.content)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                          {snippet.type === "COMMAND"
                            ? t("typeCommand")
                            : t("typeText")}
                        </span>
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                          {getScopeLabel(snippet, t)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(snippet)}
                        aria-label={
                          copiedId === snippet.id ? t("copied") : t("copy")
                        }
                        title={
                          copiedId === snippet.id ? t("copied") : t("copy")
                        }
                      >
                        {copiedId === snippet.id ? (
                          <span className="text-xs">{t("copied")}</span>
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSnippet(snippet)}
                        aria-label={t("edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(snippet)}
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
        );
      })()}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("createSnippet")}</SheetTitle>
            <SheetDescription>{t("createDescription")}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <SnippetForm
              organizations={organizations}
              projects={projects}
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={editingSnippet != null}
        onOpenChange={(open) => !open && setEditingSnippet(null)}
      >
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("editSnippet")}</SheetTitle>
            <SheetDescription>{t("editDescription")}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {editingSnippet && (
              <SnippetForm
                snippet={editingSnippet}
                organizations={organizations}
                projects={projects}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingSnippet(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
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
