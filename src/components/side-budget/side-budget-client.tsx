"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sideBudgetService,
  type SideBudgetEntry,
  type CreateSideBudgetEntryBody,
  type UpdateSideBudgetEntryBody,
} from "@/services/side-budget.service";
import { usePreferences } from "@/hooks/use-preferences";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { getCurrencyForLocale, convertAmount } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EntryForm } from "./entry-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ENTRIES_QUERY_KEY = ["side-budget", "entries"] as const;

export function SideBudgetClient() {
  const t = useTranslations("sideBudget");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const localeCurrency = getCurrencyForLocale(locale);
  const { preferences } = usePreferences();
  const { data: ratesData } = useExchangeRates(preferences.convertToLocaleCurrency);
  const rates = ratesData?.rates ?? {};
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SideBudgetEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SideBudgetEntry | null>(null);

  const showConverted =
    preferences.convertToLocaleCurrency && Object.keys(rates).length > 0;

  function formatEntryAmount(entry: SideBudgetEntry) {
    if (showConverted && entry.currency !== localeCurrency) {
      const converted = convertAmount(
        entry.amount,
        entry.currency,
        localeCurrency,
        rates
      );
      return (
        <>
          <span>
            {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            {localeCurrency}
          </span>
          <span className="text-muted-foreground text-xs ms-1">
            ({entry.amount} {entry.currency})
          </span>
        </>
      );
    }
    return (
      <>
        {entry.amount} {entry.currency}
      </>
    );
  }

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ENTRIES_QUERY_KEY,
    queryFn: () => sideBudgetService.getEntries(),
  });

  const createMutation = useMutation({
    mutationFn: async ({
      body,
      file,
    }: {
      body: CreateSideBudgetEntryBody;
      file?: File;
    }) => {
      const entry = await sideBudgetService.createEntry(body);
      if (file) {
        await sideBudgetService.uploadProof(entry.id, file);
      }
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: UpdateSideBudgetEntryBody;
    }) => sideBudgetService.updateEntry(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sideBudgetService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
      setDeleteTarget(null);
    },
  });

  const handleFormSubmit = async (
    body: CreateSideBudgetEntryBody,
    proofFile?: File
  ) => {
    if (editingEntry) {
      await updateMutation.mutateAsync({
        id: editingEntry.id,
        body: {
          amount: body.amount,
          currency: body.currency,
          date: body.date,
          type: body.type,
          description: body.description ?? null,
          proofUrl: body.proofUrl ?? null,
          proofNote: body.proofNote ?? null,
        },
      });
    } else {
      await createMutation.mutateAsync({ body, file: proofFile });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive font-medium">{t("errorLoad")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="me-2 size-4" />
          {t("addEntry")}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              {t("addEntry")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {formatEntryAmount(entry)} — {entry.type}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {entry.date.slice(0, 10)}
                      {entry.description ? ` · ${entry.description}` : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.proofUrl && (
                        <a
                          href={entry.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Link
                        </a>
                      )}
                      {entry.proofNote && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">
                          {entry.proofNote}
                        </span>
                      )}
                      {entry.proofFileUrl && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">
                          File
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingEntry(entry)}
                      aria-label={t("editEntry")}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(entry)}
                      aria-label={t("deleteConfirmTitle")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EntryForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialEntry={null}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <EntryForm
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        initialEntry={editingEntry}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tCommon("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
