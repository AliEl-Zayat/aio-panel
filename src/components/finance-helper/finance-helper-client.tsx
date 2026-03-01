"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  financeHelperService,
  type UpsertFinanceSnapshotBody,
} from "@/services/finance-helper.service";
import { sideBudgetService } from "@/services/side-budget.service";
import { usePreferences } from "@/hooks/use-preferences";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { getCurrencyForLocale, convertAmount, CURRENCY_OPTIONS } from "@/lib/currency";

function useFinanceSnapshot() {
  const query = useQuery({
    queryKey: ["finance-helper", "snapshot"],
    queryFn: async () => {
      try {
        return await financeHelperService.getSnapshot();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
  });
  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

function useReminderStatus() {
  return useQuery({
    queryKey: ["finance-helper", "reminder-status"],
    queryFn: () => financeHelperService.getReminderStatus(),
  });
}

function useSideBudgetSummary() {
  return useQuery({
    queryKey: ["side-budget", "summary"],
    queryFn: () => sideBudgetService.getSummary(),
  });
}

export function FinanceHelperClient() {
  const t = useTranslations("financeHelper");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const localeCurrency = getCurrencyForLocale(locale);
  const { preferences } = usePreferences();
  const { data: ratesData } = useExchangeRates(preferences.convertToLocaleCurrency);
  const rates = ratesData?.rates ?? {};
  const queryClient = useQueryClient();
  const { snapshot, isLoading, error, refetch } = useFinanceSnapshot();
  const { data: reminderStatus } = useReminderStatus();
  const { data: summary } = useSideBudgetSummary();

  const putMutation = useMutation({
    mutationFn: (body: UpsertFinanceSnapshotBody) =>
      financeHelperService.putSnapshot(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-helper", "snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["finance-helper", "reminder-status"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body: UpsertFinanceSnapshotBody = {
      savings: Number((form.elements.namedItem("savings") as HTMLInputElement)?.value) || 0,
      availableMoney: Number((form.elements.namedItem("availableMoney") as HTMLInputElement)?.value) || 0,
      funds: Number((form.elements.namedItem("funds") as HTMLInputElement)?.value) || 0,
      incomes: Number((form.elements.namedItem("incomes") as HTMLInputElement)?.value) || 0,
      currency: (form.elements.namedItem("currency") as HTMLSelectElement)?.value || "USD",
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement)?.value || null,
    };
    putMutation.mutate(body);
  };

  const setIncomesFromSummary = () => {
    if (summary?.incomeTotal == null) return;
    const form = document.getElementById("finance-snapshot-form") as HTMLFormElement | null;
    if (form) {
      const input = form.elements.namedItem("incomes") as HTMLInputElement | null;
      if (input) input.value = String(summary.incomeTotal);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 rounded-lg border p-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive font-medium">{t("errorLoad")}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  const lastUpdated = snapshot?.lastUpdatedAt ?? reminderStatus?.lastUpdatedAt;
  const initialSavings = snapshot?.savings ?? 0;
  const initialAvailableMoney = snapshot?.availableMoney ?? 0;
  const initialFunds = snapshot?.funds ?? 0;
  const initialIncomes = snapshot?.incomes ?? 0;
  const initialCurrency = snapshot?.currency ?? "USD";
  const initialNotes = snapshot?.notes ?? "";

  const showConverted =
    preferences.convertToLocaleCurrency &&
    localeCurrency !== initialCurrency &&
    Object.keys(rates).length > 0;

  return (
    <div className="space-y-6">
      {summary != null && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <span className="text-sm text-muted-foreground">
            {t("sideBudgetIncomeLast30Days")}: <strong>{summary.incomeTotal}</strong>
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={setIncomesFromSummary}>
            {t("useInSnapshot")}
          </Button>
        </div>
      )}

      <form
        id="finance-snapshot-form"
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border p-4"
      >
        {lastUpdated ? (
          <p className="text-sm text-muted-foreground">
            {t("lastUpdated")}: {new Date(lastUpdated).toLocaleString()}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("notSetYet")}</p>
        )}

        {showConverted && snapshot && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="mb-1 font-medium text-muted-foreground">
              {t("displayConverted")} {localeCurrency} ({t("atCurrentRate")})
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>
                {t("savings")}:{" "}
                {convertAmount(
                  snapshot.savings,
                  snapshot.currency,
                  localeCurrency,
                  rates
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                {localeCurrency}
              </li>
              <li>
                {t("availableMoney")}:{" "}
                {convertAmount(
                  snapshot.availableMoney,
                  snapshot.currency,
                  localeCurrency,
                  rates
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                {localeCurrency}
              </li>
              <li>
                {t("funds")}:{" "}
                {convertAmount(
                  snapshot.funds,
                  snapshot.currency,
                  localeCurrency,
                  rates
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                {localeCurrency}
              </li>
              <li>
                {t("incomes")}:{" "}
                {convertAmount(
                  snapshot.incomes,
                  snapshot.currency,
                  localeCurrency,
                  rates
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                {localeCurrency}
              </li>
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">{t("currency")}</Label>
            <select
              id="currency"
              name="currency"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue={initialCurrency}
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="savings">{t("savings")}</Label>
            <Input
              id="savings"
              name="savings"
              type="number"
              min={0}
              step="0.01"
              defaultValue={initialSavings}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availableMoney">{t("availableMoney")}</Label>
            <Input
              id="availableMoney"
              name="availableMoney"
              type="number"
              min={0}
              step="0.01"
              defaultValue={initialAvailableMoney}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="funds">{t("funds")}</Label>
            <Input
              id="funds"
              name="funds"
              type="number"
              min={0}
              step="0.01"
              defaultValue={initialFunds}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomes">{t("incomes")}</Label>
            <Input
              id="incomes"
              name="incomes"
              type="number"
              min={0}
              step="0.01"
              defaultValue={initialIncomes}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">{t("notes")}</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            className="resize-none"
            defaultValue={initialNotes}
          />
        </div>
        <Button type="submit" disabled={putMutation.isPending}>
          {putMutation.isPending ? tCommon("saving") : tCommon("save")}
        </Button>
      </form>
    </div>
  );
}
