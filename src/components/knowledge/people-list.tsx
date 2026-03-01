"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  peopleService,
  type PersonListFilter,
} from "@/services/people.service";
import { companyService } from "@/services/company.service";
import { organizationService } from "@/services/organization.service";
import { projectService } from "@/services/project.service";
import type { Person } from "@/types/api";
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
import { PersonForm } from "./person-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

const PEOPLE_QUERY_KEY = ["knowledge-people"] as const;
const COMPANIES_QUERY_KEY = ["companies"] as const;
const ORGANIZATIONS_QUERY_KEY = ["organizations"] as const;
const PROJECTS_QUERY_KEY = ["projects"] as const;

function filterToPersonListFilter(filter: string): PersonListFilter {
  if (filter === "all") return { type: "all" };
  if (filter === "common") return { type: "common" };
  if (filter.startsWith("company-")) {
    const n = Number(filter.slice(8));
    return Number.isInteger(n) ? { type: "company", id: n } : { type: "all" };
  }
  if (filter.startsWith("org-")) {
    const n = Number(filter.slice(4));
    return Number.isInteger(n)
      ? { type: "organization", id: n }
      : { type: "all" };
  }
  if (filter.startsWith("project-")) {
    const n = Number(filter.slice(8));
    return Number.isInteger(n) ? { type: "project", id: n } : { type: "all" };
  }
  return { type: "all" };
}

function getPersonContextLabel(
  person: Person,
  t: ReturnType<typeof useTranslations<"knowledge">>
): string {
  if (person.company?.name) return person.company.name;
  if (person.organization?.name) return person.organization.name;
  if (person.project?.name) return person.project.name;
  return t("common");
}

export function PeopleList() {
  const t = useTranslations("knowledge");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: companies = [] } = useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: () => companyService.list(),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: () => organizationService.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => projectService.list("all"),
  });

  const personListFilter = useMemo(
    () => filterToPersonListFilter(filter),
    [filter]
  );

  const {
    data: people = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PEOPLE_QUERY_KEY, filter],
    queryFn: () => peopleService.list(personListFilter),
  });

  const filterOptions: { value: string; label: string }[] = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: t("filterAll") },
      { value: "common", label: t("filterCommon") },
    ];
    companies.forEach((c) => {
      opts.push({ value: `company-${c.id}`, label: c.name });
    });
    organizations.forEach((o) => {
      opts.push({ value: `org-${o.id}`, label: o.name });
    });
    projects.forEach((p) => {
      opts.push({ value: `project-${p.id}`, label: p.name });
    });
    return opts;
  }, [companies, organizations, projects, t]);

  const invalidatePeople = () => {
    queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY });
  };

  const handleCreateSuccess = () => {
    invalidatePeople();
    setCreateOpen(false);
  };

  const handleEditSuccess = () => {
    invalidatePeople();
    setEditingPerson(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await peopleService.remove(deleteTarget.id);
      invalidatePeople();
      setDeleteTarget(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setActionError(
        axiosError.response?.data?.error ?? t("deletePersonError")
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4" scope="col">
                    {t("personName")}
                  </th>
                  <th className="text-left font-medium p-4" scope="col">
                    {t("email")}
                  </th>
                  <th className="text-left font-medium p-4" scope="col">
                    {t("phone")}
                  </th>
                  <th className="text-left font-medium p-4" scope="col">
                    {t("context")}
                  </th>
                  <th className="text-right font-medium p-4" scope="col">
                    {tCommon("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-4">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-36" />
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

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive mb-2">
            {error instanceof Error ? error.message : t("loadPeopleError")}
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
        <SegmentControl
          value={filter}
          options={filterOptions}
          onValueChange={setFilter}
          aria-label={t("filterByCompany")}
        />
        <Button
          title={t("addPerson")}
          aria-label={t("addPerson")}
          onClick={() => {
            setActionError(null);
            setEditingPerson(null);
            setCreateOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t("addPerson")}
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
            <AlertDialogTitle>{t("deletePerson")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePersonConfirm")}
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
              {isDeleting ? tCommon("deleting") : t("deletePerson")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {people.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">{t("noPeopleYet")}</p>
            <Button
              title={t("addPerson")}
              aria-label={t("addPerson")}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              {t("addPerson")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="sr-only">
            <span>{t("people")}</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4" scope="col">
                      {t("personName")}
                    </th>
                    <th className="text-left font-medium p-4" scope="col">
                      {t("email")}
                    </th>
                    <th className="text-left font-medium p-4" scope="col">
                      {t("phone")}
                    </th>
                    <th className="text-left font-medium p-4" scope="col">
                      {t("context")}
                    </th>
                    <th className="text-right font-medium p-4" scope="col">
                      {tCommon("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((person) => (
                    <tr
                      key={person.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="p-4 font-medium">{person.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {person.email ?? "—"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {person.phone ?? "—"}
                      </td>
                      <td className="p-4">
                        {getPersonContextLabel(person, t)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActionError(null);
                              setCreateOpen(false);
                              setEditingPerson(person);
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
                              setDeleteTarget(person);
                            }}
                          >
                            <Trash2 className="size-4" />
                            {t("deletePerson")}
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
        open={createOpen || !!editingPerson}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingPerson(null);
          }
        }}
      >
        <DialogContent className="overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {createOpen ? t("createPerson") : t("editPerson")}
            </DialogTitle>
            <DialogDescription>
              {createOpen
                ? t("createPersonDescription")
                : t("editPersonDescription")}
            </DialogDescription>
          </DialogHeader>
          {createOpen && (
            <PersonForm
              companies={companies}
              organizations={organizations}
              projects={projects}
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
            />
          )}
          {!createOpen && editingPerson && (
            <PersonForm
              person={editingPerson}
              companies={companies}
              organizations={organizations}
              projects={projects}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingPerson(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
