"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { companyService } from "@/services/company.service";
import type { Company } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { CompanyForm } from "./company-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

const COMPANIES_QUERY_KEY = ["companies"] as const;

type DeleteTarget = { id: number; name: string } | null;

function CreateCompanyDialog({
  open,
  onOpenChange,
  queryClient,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryClient: QueryClient;
}>) {
  const t = useTranslations("knowledge");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("createCompany")}</DialogTitle>
          <DialogDescription>{t("createCompanyDescription")}</DialogDescription>
        </DialogHeader>
        <CompanyForm
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditCompanyDialog({
  company,
  open,
  onOpenChange,
  queryClient,
}: Readonly<{
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryClient: QueryClient;
}>) {
  const t = useTranslations("knowledge");
  if (!company) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("editCompany")}</DialogTitle>
          <DialogDescription>{t("editCompanyDescription")}</DialogDescription>
        </DialogHeader>
        <CompanyForm
          company={company}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function CompaniesList() {
  const t = useTranslations("knowledge");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: companies = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: () => companyService.list(),
  });

  async function handleConfirmRemove() {
    if (!deleteTarget) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await companyService.remove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      setDeleteTarget(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setActionError(
        axiosError.response?.data?.error ?? t("deleteCompanyError")
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">{tCommon("name")}</th>
                  <th className="text-left font-medium p-4">{tCommon("slug")}</th>
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

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive mb-2">
            {error instanceof Error ? error.message : t("loadCompaniesError")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {tCommon("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">{t("noCompaniesYet")}</p>
            <Button
              title={t("addCompany")}
              aria-label={t("addCompany")}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              {t("addCompany")}
            </Button>
          </CardContent>
        </Card>
        <CreateCompanyDialog
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
          title={t("addCompany")}
          aria-label={t("addCompany")}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          {t("addCompany")}
        </Button>
      </div>
      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      <CreateCompanyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        queryClient={queryClient}
      />
      <EditCompanyDialog
        company={editingCompany}
        open={editingCompany != null}
        onOpenChange={(open) => !open && setEditingCompany(null)}
        queryClient={queryClient}
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCompany")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? t("deleteCompanyConfirm", { name: deleteTarget.name })
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
              {isDeleting ? tCommon("deleting") : t("deleteCompany")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="sr-only">
          <span>{t("companies")}</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4" scope="col">
                    {tCommon("name")}
                  </th>
                  <th className="text-left font-medium p-4" scope="col">
                    {tCommon("slug")}
                  </th>
                  <th className="text-right font-medium p-4" scope="col">
                    {tCommon("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="p-4 font-medium">{company.name}</td>
                    <td className="p-4 text-muted-foreground">{company.slug}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActionError(null);
                            setEditingCompany(company);
                          }}
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
                            setDeleteTarget({ id: company.id, name: company.name });
                          }}
                        >
                          <Trash2 className="size-4" />
                          {t("deleteCompany")}
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
    </div>
  );
}
