"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Link from "next/link";
import { organizationService } from "@/services/organization.service";
import type { OrganizationMembership } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { CreateOrganizationForm } from "./create-organization-form";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

function CreateOrganizationSheet({
  open,
  onOpenChange,
  queryClient,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryClient: QueryClient;
}>) {
  const t = useTranslations("organizations");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("create")}</SheetTitle>
          <SheetDescription>{t("createDescription")}</SheetDescription>
        </SheetHeader>
        <CreateOrganizationForm
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function formatRole(role: string, t: ReturnType<typeof useTranslations<"organizations">>): string {
  if (role === "ADMIN") return t("admin");
  if (role === "MEMBER") return t("member");
  return role;
}

function isAdmin(role: string): boolean {
  return role === "ADMIN";
}

type DeleteTarget = { id: number; name: string } | null;

export function OrganizationsList() {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    data: organizations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationService.list(),
  });

  async function handleConfirmRemove() {
    if (!deleteTarget) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await organizationService.remove(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setDeleteTarget(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const message = axiosError.response?.data?.error ?? t("deleteError");
      setActionError(message);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <OrganizationsListSkeleton t={t} tCommon={tCommon} />;
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

  if (organizations.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">{t("noOrganizationsYet")}</p>
            <Button
              title={t("create")}
              aria-label={t("create")}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              {t("create")}
            </Button>
          </CardContent>
        </Card>
        <CreateOrganizationSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          queryClient={queryClient}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          title={t("create")}
          aria-label={t("create")}
          onClick={() => setCreateOpen(true)}
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
      <CreateOrganizationSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        queryClient={queryClient}
      />
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
                handleConfirmRemove();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                  <th className="text-left font-medium p-4">{t("role")}</th>
                  <th className="text-right font-medium p-4">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org: OrganizationMembership) => (
                  <tr
                    key={org.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="p-4 font-medium">{org.name}</td>
                    <td className="p-4 text-muted-foreground">{org.slug}</td>
                    <td className="p-4">{formatRole(org.role, t)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/organizations/${org.id}`}>
                            <Eye className="size-4" />
                            {t("view")}
                          </Link>
                        </Button>
                        {isAdmin(org.role) && (
                          <>
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/dashboard/organizations/${org.id}?tab=details`}
                              >
                                <Pencil className="size-4" />
                                {t("edit")}
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setActionError(null);
                                setDeleteTarget({ id: org.id, name: org.name });
                              }}
                            >
                              <Trash2 className="size-4" />
                              {t("delete")}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationsListSkeleton({
  t,
  tCommon,
}: {
  t: ReturnType<typeof useTranslations<"organizations">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium p-4">{tCommon("name")}</th>
                <th className="text-left font-medium p-4">{tCommon("slug")}</th>
                <th className="text-left font-medium p-4">{t("role")}</th>
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
                    <Skeleton className="h-5 w-16" />
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
