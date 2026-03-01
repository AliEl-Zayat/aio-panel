"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  secretAccountService,
  type SecretAccountListParams,
} from "@/services/secret-account.service";
import { organizationService } from "@/services/organization.service";
import { projectService } from "@/services/project.service";
import type { SecretAccount } from "@/types/api";
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
import { SecretAccountForm } from "./secret-account-form";
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff, ExternalLink } from "lucide-react";

const SECRET_ACCOUNTS_QUERY_KEY = ["secret-accounts"] as const;
const ORGANIZATIONS_QUERY_KEY = ["organizations"] as const;
const PROJECTS_QUERY_KEY = ["projects"] as const;

function getScopeLabel(
  account: SecretAccount,
  t: ReturnType<typeof useTranslations<"secretAccounts">>
): string {
  if (account.organization?.name) return account.organization.name;
  if (account.project?.name) return account.project.name;
  return t("scopePersonal");
}

export function SecretAccountsClient() {
  const t = useTranslations("secretAccounts");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrg();

  const [scopeFilter, setScopeFilter] = useState<
    "all" | "personal" | "org" | "project"
  >("all");
  const [projectIdForFilter, setProjectIdForFilter] = useState<number | null>(
    null
  );
  const [serviceFilter, setServiceFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SecretAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SecretAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<number | null>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [revealErrorId, setRevealErrorId] = useState<number | null>(null);

  const listParams = useMemo((): SecretAccountListParams | undefined => {
    const params: SecretAccountListParams = {};
    if (scopeFilter === "personal") params.scope = "personal";
    else if (scopeFilter === "org" && currentOrganizationId != null)
      params.organizationId = currentOrganizationId;
    else if (scopeFilter === "project" && projectIdForFilter != null)
      params.projectId = projectIdForFilter;
    if (serviceFilter.trim()) params.service = serviceFilter.trim();
    return Object.keys(params).length > 0 ? params : undefined;
  }, [scopeFilter, currentOrganizationId, projectIdForFilter, serviceFilter]);

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: [...SECRET_ACCOUNTS_QUERY_KEY, listParams],
    queryFn: () => secretAccountService.list(listParams),
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
    queryClient.invalidateQueries({ queryKey: SECRET_ACCOUNTS_QUERY_KEY });
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: SECRET_ACCOUNTS_QUERY_KEY });
    setEditingAccount(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await secretAccountService.remove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: SECRET_ACCOUNTS_QUERY_KEY });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyPassword = async (account: SecretAccount) => {
    setCopyErrorId(null);
    setRevealErrorId(null);
    try {
      const { password } = await secretAccountService.reveal(account.id);
      await navigator.clipboard.writeText(password);
      setCopiedId(account.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
      setCopyErrorId(account.id);
      setTimeout(() => setCopyErrorId(null), 5000);
    }
  };

  const handleRevealToggle = async (account: SecretAccount) => {
    if (revealedId === account.id) {
      setRevealedId(null);
      setRevealedPassword(null);
      setRevealErrorId(null);
      return;
    }
    setRevealErrorId(null);
    try {
      const { password } = await secretAccountService.reveal(account.id);
      setRevealedId(account.id);
      setRevealedPassword(password);
    } catch {
      setRevealErrorId(account.id);
      setTimeout(() => setRevealErrorId(null), 5000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
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
          <input
            type="text"
            placeholder={t("service")}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
            aria-label={t("service")}
          />
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
        if (accounts.length === 0) {
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
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{account.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {account.username}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {account.service && (
                          <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                            {account.service}
                          </span>
                        )}
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                          {getScopeLabel(account, t)}
                        </span>
                      </div>
                      {account.loginUrl && (
                        <a
                          href={account.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {t("openLoginUrl")}
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      {revealedId === account.id && (
                        <p
                          className="mt-2 break-all font-mono text-xs"
                          data-revealed
                        >
                          {revealedPassword ?? "…"}
                        </p>
                      )}
                      {revealErrorId === account.id && (
                        <p className="text-destructive mt-1 text-xs" role="alert">
                          {t("revealError")}
                        </p>
                      )}
                      {copyErrorId === account.id && (
                        <p className="text-destructive mt-1 text-xs" role="alert">
                          {t("copyError")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyPassword(account)}
                        aria-label={
                          copiedId === account.id ? t("copied") : t("copy")
                        }
                        title={copiedId === account.id ? t("copied") : t("copy")}
                      >
                        {copiedId === account.id ? (
                          <span className="text-xs">{t("copied")}</span>
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevealToggle(account)}
                        aria-label={t("reveal")}
                        title={t("reveal")}
                      >
                        {revealedId === account.id ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingAccount(account)}
                        aria-label={t("edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(account)}
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
            <DialogTitle>{t("createAccount")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>
          <SecretAccountForm
            organizations={organizations}
            projects={projects}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingAccount != null}
        onOpenChange={(o) => !o && setEditingAccount(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editAccount")}</DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <SecretAccountForm
              organizations={organizations}
              projects={projects}
              initial={editingAccount}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingAccount(null)}
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
