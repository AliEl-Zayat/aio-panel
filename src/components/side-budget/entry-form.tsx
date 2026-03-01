"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { SideBudgetEntry, CreateSideBudgetEntryBody } from "@/services/side-budget.service";
import { CURRENCY_OPTIONS } from "@/lib/currency";

type EntryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEntry?: SideBudgetEntry | null;
  onSubmit: (body: CreateSideBudgetEntryBody, proofFile?: File) => Promise<void>;
  isSubmitting: boolean;
};

export function EntryForm({
  open,
  onOpenChange,
  initialEntry,
  onSubmit,
  isSubmitting,
}: EntryFormProps) {
  const t = useTranslations("sideBudget");
  const tCommon = useTranslations("common");
  const isEdit = !!initialEntry;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement)?.value);
    const currency = (form.elements.namedItem("currency") as HTMLSelectElement)?.value || "USD";
    const date = (form.elements.namedItem("date") as HTMLInputElement)?.value;
    const type = (form.elements.namedItem("type") as HTMLSelectElement)?.value as "INCOME" | "EXPENSE";
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement)?.value?.trim() || null;
    const proofUrl = (form.elements.namedItem("proofUrl") as HTMLInputElement)?.value?.trim() || null;
    const proofNote = (form.elements.namedItem("proofNote") as HTMLInputElement)?.value?.trim() || null;
    const proofFile = (form.elements.namedItem("proofFile") as HTMLInputElement)?.files?.[0];

    if (!proofUrl && !proofNote && !proofFile) {
      return; // validation message
    }
    const body: CreateSideBudgetEntryBody = {
      amount,
      currency,
      date,
      type,
      description,
      proofUrl: proofUrl || undefined,
      proofNote: proofNote || undefined,
    };
    await onSubmit(body, proofFile ?? undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editEntry") : t("addEntry")}</DialogTitle>
          <DialogDescription>{t("atLeastOneProof")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("amount")}</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={initialEntry?.amount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <select
                id="currency"
                name="currency"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={initialEntry?.currency ?? "USD"}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={initialEntry?.date?.slice(0, 10)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{t("type")}</Label>
            <select
              id="type"
              name="type"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              defaultValue={initialEntry?.type ?? "INCOME"}
            >
              <option value="INCOME">{t("income")}</option>
              <option value="EXPENSE">{t("expense")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              className="resize-none"
              defaultValue={initialEntry?.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proofUrl">{t("proofUrl")}</Label>
            <Input
              id="proofUrl"
              name="proofUrl"
              type="url"
              placeholder="https://…"
              defaultValue={initialEntry?.proofUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proofNote">{t("proofNote")}</Label>
            <Input
              id="proofNote"
              name="proofNote"
              type="text"
              placeholder="e.g. Receipt #123"
              defaultValue={initialEntry?.proofNote ?? ""}
            />
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="proofFile">{t("proofFile")}</Label>
              <Input id="proofFile" name="proofFile" type="file" accept="image/*,application/pdf" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
