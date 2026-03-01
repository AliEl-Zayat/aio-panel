"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  secretKeyService,
  type SecretKeyListParams,
} from "@/services/secret-key.service";
import { organizationService } from "@/services/organization.service";
import { projectService } from "@/services/project.service";
import type { SecretKey, SecretKeyKind } from "@/types/api";
import { useCurrentOrg } from "@/contexts/current-org-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { SecretKeyForm } from "./secret-key-form";
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff } from "lucide-react";

const SECRET_KEYS_QUERY_KEY = ["secret-keys"] as const;
const ORGANIZATIONS_QUERY_KEY = ["organizations"] as const;
const PROJECTS_QUERY_KEY = ["projects"] as const;

function getScopeLabel(
  key: SecretKey,
  t: ReturnType<typeof useTranslations<"secretKeys">>
): string {
  if (key.organization?.name) return key.organization.name;
  if (key.project?.name) return key.project.name;
  return t("scopePersonal");
}

export function SecretKeysClient() {
  const t = useTranslations("secretKeys");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrg();

  const [kindFilter, setKindFilter] = useState<"all" | SecretKeyKind>("all");
  const [scopeFilter, setScopeFilter] = useState<
    "all" | "personal" | "org" | "project"
  >("all");
  const [projectIdForFilter, setProjectIdForFilter] = useState<number | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<SecretKey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SecretKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<number | null>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [revealErrorId, setRevealErrorId] = useState<number | null>(null);

  const listParams = useMemo((): SecretKeyListParams | undefined => {
    const params: SecretKeyListParams = {};
    if (kindFilter !== "all") params.kind = kindFilter;
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
  }, [kindFilter, scopeFilter, currentOrganizationId, projectIdForFilter]);

  const { data: keys = [], isLoading, error } = useQuery({
    queryKey: [...SECRET_KEYS_QUERY_KEY, listParams],
    queryFn: () => secretKeyService.list(listParams),
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

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: SECRET_KEYS_QUERY_KEY });
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: SECRET_KEYS_QUERY_KEY });
    setEditingKey(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await secretKeyService.remove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: SECRET_KEYS_QUERY_KEY });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async (key: SecretKey) => {
    if (key.kind !== "API_KEY") return;
    setCopyErrorId(null);
    setRevealErrorId(null);
    try {
      const { value } = await secretKeyService.reveal(key.id);
      await navigator.clipboard.writeText(value);
      setCopiedId(key.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
      setCopyErrorId(key.id);
      setTimeout(() => setCopyErrorId(null), 5000);
    }
  };

  const handleRevealToggle = async (key: SecretKey) => {
    if (revealedId === key.id) {
      setRevealedId(null);
      setRevealedValue(null);
      setRevealErrorId(null);
      return;
    }
    setRevealErrorId(null);
    try {
      const { value } = await secretKeyService.reveal(key.id);
      setRevealedId(key.id);
      setRevealedValue(value);
    } catch {
      setRevealErrorId(key.id);
      setTimeout(() => setRevealErrorId(null), 5000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant={kindFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setKindFilter("all")}
            >
              {t("scopeAll")}
            </Button>
            <Button
              variant={kindFilter === "API_KEY" ? "default" : "outline"}
              size="sm"
              onClick={() => setKindFilter("API_KEY")}
            >
              {t("kindApiKey")}
            </Button>
            <Button
              variant={kindFilter === "ENCRYPTION_KEY" ? "default" : "outline"}
              size="sm"
              onClick={() => setKindFilter("ENCRYPTION_KEY")}
            >
              {t("kindEncryptionKey")}
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

      {(() => {
        if (isLoading) return <Skeleton className="h-32 w-full" />;
        if (keys.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">{t("empty")}</p>
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  {t("add")}
                </Button>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keys.map((key) => (
              <Card key={key.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{key.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {key.hint ?? "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                          {key.kind === "API_KEY"
                            ? t("kindApiKey")
                            : t("kindEncryptionKey")}
                        </span>
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                          {getScopeLabel(key, t)}
                        </span>
                      </div>
                      {key.kind === "API_KEY" && revealedId === key.id && (
                        <p
                          className="mt-2 break-all font-mono text-xs"
                          data-revealed
                        >
                          {revealedValue ?? "…"}
                        </p>
                      )}
                      {revealErrorId === key.id && (
                        <p className="text-destructive mt-1 text-xs" role="alert">
                          {t("revealError")}
                        </p>
                      )}
                      {copyErrorId === key.id && (
                        <p className="text-destructive mt-1 text-xs" role="alert">
                          {t("copyError")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {key.kind === "API_KEY" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(key)}
                            aria-label={
                              copiedId === key.id ? t("copied") : t("copy")
                            }
                            title={copiedId === key.id ? t("copied") : t("copy")}
                          >
                            {copiedId === key.id ? (
                              <span className="text-xs">{t("copied")}</span>
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevealToggle(key)}
                            aria-label={t("reveal")}
                            title={t("reveal")}
                          >
                            {revealedId === key.id ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingKey(key)}
                        aria-label={t("edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(key)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createKey")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>
          <SecretKeyForm
            organizations={organizations}
            projects={projects}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editingKey != null} onOpenChange={(o) => !o && setEditingKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editKey")}</DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>
          {editingKey && (
            <SecretKeyForm
              organizations={organizations}
              projects={projects}
              initial={editingKey}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingKey(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
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
