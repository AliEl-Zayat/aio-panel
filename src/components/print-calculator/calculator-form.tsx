"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { inventoryService, type Product } from "@/services/inventory.service";
import { parseFileVolume } from "@/lib/print-calculator/parse-volume";
import { estimatePrintDurationHours } from "@/lib/print-calculator/estimate-duration";
import { renderModelToImageBlob } from "@/lib/print-calculator/render-model-to-image";
import {
  computeCostFromBRD,
  type WearComponentInput,
} from "@/lib/print-calculator/cost";
import {
  getPrinterProfiles,
  savePrinterProfile,
  deletePrinterProfile,
  getMaterialProfiles,
  saveMaterialProfile,
  deleteMaterialProfile,
  type PrinterProfile,
  type MaterialProfile,
} from "@/lib/print-calculator/profiles";
import {
  downloadCalculationCSV,
  downloadCalculationPDF,
  printInvoice,
} from "@/lib/print-calculator/export-calc";
import { usePreferences } from "@/hooks/use-preferences";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import {
  getCurrencyForLocale,
  convertAmount,
  CURRENCY_OPTIONS,
} from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Info, Plus, Trash2, Download, FileText, Printer } from "lucide-react";
import { ClientFields } from "@/components/client-fields";
import { cn } from "@/lib/utils";

const PRODUCTS_QUERY_KEY = ["inventory", "products"] as const;

const WEIGHT_MIN = 1;
const WEIGHT_MAX = 2000;
const DURATION_MIN_MINUTES = 30;
const DURATION_MAX_DAYS = 5;
const DURATION_MAX_HOURS = DURATION_MAX_DAYS * 24;
const DEFAULT_LABOR = 40;
const DEFAULT_RISK_PERCENT = 10;
const DEFAULT_PROFIT_MARGIN = 30;
const DEFAULT_MACHINE_HOURLY = 0;
const DEFAULT_POWER_WATTS = 200;
const DEFAULT_ELECTRICITY_RATE = 2.27;
const SUGGESTED_MACHINE_HOURLY_EGP = 50;
const SUGGESTED_MATERIAL_MARKUP = 1.1;
const DRAFT_STORAGE_KEY = "form-draft:print-calculator";

function nextWearId(components: WearComponentInput[]): string {
  const max = components.reduce(
    (m, c) => Math.max(m, parseInt(c.id.replace(/\D/g, "") || "0", 10)),
    0
  );
  return `wear-${max + 1}`;
}

interface ClientDraft {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
}

interface CalculatorDraft {
  weightG: number;
  durationHours: number;
  laborPerHour: number;
  laborTimeHours: number | null;
  machineHourlyRate: number;
  powerWatts: number;
  electricityRatePerKwh: number;
  materialWastePercent: number;
  materialMarkupFactor: number;
  riskPercent: number;
  profitMarginPercent: number;
  wearComponents: WearComponentInput[];
  selectedMaterialId: number | null;
  currencyOverride: string;
  discountPercent: number;
  client: ClientDraft;
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeCurrency(c: string | null | undefined): string {
  const code = c?.trim();
  return code?.length === 3 ? code.toUpperCase() : "USD";
}

export function PrintCalculatorForm() {
  const t = useTranslations("printCalculator");
  const locale = useLocale();
  const localeCurrency = getCurrencyForLocale(locale);
  const { preferences } = usePreferences();
  const { data: ratesData } = useExchangeRates(preferences.convertToLocaleCurrency);
  const rates = ratesData?.rates ?? {};
  const showConverted =
    preferences.convertToLocaleCurrency && Object.keys(rates).length > 0;

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [volumeCm3, setVolumeCm3] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Product | null>(null);
  const [currencyOverride, setCurrencyOverride] = useState<string>(() =>
    getCurrencyForLocale(locale)
  );
  const [weightG, setWeightG] = useState<number>(100);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [laborPerHour, setLaborPerHour] = useState<number>(DEFAULT_LABOR);
  const [laborTimeHours, setLaborTimeHours] = useState<number | null>(null);
  const [machineHourlyRate, setMachineHourlyRate] = useState<number>(
    DEFAULT_MACHINE_HOURLY
  );
  const [powerWatts, setPowerWatts] = useState<number>(DEFAULT_POWER_WATTS);
  const [electricityRatePerKwh, setElectricityRatePerKwh] = useState<number>(
    DEFAULT_ELECTRICITY_RATE
  );
  const [materialWastePercent, setMaterialWastePercent] = useState<number>(10);
  const [materialMarkupFactor, setMaterialMarkupFactor] = useState<number>(1);
  const [riskPercent, setRiskPercent] = useState<number>(DEFAULT_RISK_PERCENT);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(
    DEFAULT_PROFIT_MARGIN
  );
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [client, setClient] = useState<ClientDraft>({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
  });
  const [wearComponents, setWearComponents] = useState<WearComponentInput[]>(
    []
  );
  const [printerProfiles, setPrinterProfiles] = useState<PrinterProfile[]>([]);
  const [materialProfiles, setMaterialProfiles] = useState<MaterialProfile[]>(
    []
  );
  const [selectedPrinterProfileId, setSelectedPrinterProfileId] = useState<
    string | null
  >(null);
  const [selectedMaterialProfileId, setSelectedMaterialProfileId] = useState<
    string | null
  >(null);
  const [isParsing, setIsParsing] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const draftRestored = useRef(false);

  const workingCurrency = normalizeCurrency(
    selectedMaterial?.currency ?? currencyOverride
  );

  useEffect(() => {
    if (typeof window === "undefined" || draftRestored.current) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<CalculatorDraft>;
      draftRestored.current = true;
      if (typeof draft.weightG === "number") setWeightG(draft.weightG);
      if (typeof draft.durationHours === "number")
        setDurationHours(draft.durationHours);
      if (typeof draft.laborPerHour === "number")
        setLaborPerHour(draft.laborPerHour);
      if (typeof draft.laborTimeHours === "number")
        setLaborTimeHours(draft.laborTimeHours);
      else if (draft.laborTimeHours === null) setLaborTimeHours(null);
      if (typeof draft.machineHourlyRate === "number")
        setMachineHourlyRate(draft.machineHourlyRate);
      if (typeof draft.powerWatts === "number") setPowerWatts(draft.powerWatts);
      if (typeof draft.electricityRatePerKwh === "number")
        setElectricityRatePerKwh(draft.electricityRatePerKwh);
      if (typeof draft.materialWastePercent === "number")
        setMaterialWastePercent(draft.materialWastePercent);
      if (typeof draft.materialMarkupFactor === "number")
        setMaterialMarkupFactor(draft.materialMarkupFactor);
      if (typeof draft.riskPercent === "number")
        setRiskPercent(draft.riskPercent);
      if (typeof draft.profitMarginPercent === "number")
        setProfitMarginPercent(draft.profitMarginPercent);
      if (Array.isArray(draft.wearComponents) && draft.wearComponents.length > 0)
        setWearComponents(draft.wearComponents);
      if (typeof draft.currencyOverride === "string" && draft.currencyOverride.length === 3)
        setCurrencyOverride(draft.currencyOverride.toUpperCase());
      if (typeof draft.discountPercent === "number")
        setDiscountPercent(Math.max(0, Math.min(100, draft.discountPercent)));
      if (
        draft.client &&
        typeof draft.client.clientName === "string" &&
        typeof draft.client.clientEmail === "string" &&
        typeof draft.client.clientAddress === "string"
      )
        setClient(draft.client);
    } catch {
      /* ignore */
    }
  }, []);

  const effectiveLaborTimeHours =
    laborTimeHours ?? durationHours;

  useEffect(() => {
    if (typeof window === "undefined" || !draftRestored.current) return;
    const draft: CalculatorDraft = {
      weightG,
      durationHours,
      laborPerHour,
      laborTimeHours,
      machineHourlyRate,
      powerWatts,
      electricityRatePerKwh,
      materialWastePercent,
      materialMarkupFactor,
      riskPercent,
      profitMarginPercent,
      wearComponents,
      selectedMaterialId: selectedMaterial?.id ?? null,
      currencyOverride: workingCurrency,
      discountPercent,
      client,
    };
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    weightG,
    durationHours,
    laborPerHour,
    laborTimeHours,
    machineHourlyRate,
    powerWatts,
    electricityRatePerKwh,
    materialWastePercent,
    materialMarkupFactor,
    riskPercent,
    profitMarginPercent,
    wearComponents,
    selectedMaterial?.id,
    workingCurrency,
    discountPercent,
    client,
  ]);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: () => inventoryService.getProducts(),
  });

  const materials = useMemo(
    () =>
      products.filter(
        (p): p is Product & { densityGPerCm3: number } =>
          p.densityGPerCm3 != null && p.densityGPerCm3 > 0
      ),
    [products]
  );

  useEffect(() => {
    if (materials.length === 0 || selectedMaterial != null) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<CalculatorDraft>;
      const id = draft.selectedMaterialId;
      if (id != null) {
        const mat = materials.find((m) => m.id === id);
        if (mat) {
          setSelectedMaterial(mat);
          if (mat.currency && mat.currency.length === 3)
            setCurrencyOverride(mat.currency.toUpperCase());
        }
      }
    } catch {
      /* ignore */
    }
  }, [materials, selectedMaterial]);

  const estimatedWeightFromVolume = useMemo(() => {
    if (volumeCm3 == null || selectedMaterial?.densityGPerCm3 == null)
      return null;
    return volumeCm3 * selectedMaterial.densityGPerCm3;
  }, [volumeCm3, selectedMaterial]);

  const estimatedDurationFromVolume = useMemo(() => {
    if (volumeCm3 == null) return null;
    return estimatePrintDurationHours(volumeCm3);
  }, [volumeCm3]);

  const handleFile = useCallback(async (f: File | null) => {
    if (!f) {
      setFile(null);
      setFileName("");
      setVolumeCm3(null);
      setParseError(null);
      return;
    }
    const ext = f.name.toLowerCase().slice(-4);
    if (ext !== ".stl" && ext !== ".3mf") {
      setParseError(t("parseError"));
      return;
    }
    setFile(f);
    setFileName(f.name);
    setParseError(null);
    setIsParsing(true);
    try {
      const { volumeCm3: vol } = await parseFileVolume(f);
      setVolumeCm3(vol);
      setParseError(null);
    } catch {
      setParseError(t("parseError"));
      setVolumeCm3(null);
    } finally {
      setIsParsing(false);
    }
  }, [t]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      handleFile(f ?? null);
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // When we have volume and material, suggest weight; when we have volume, suggest duration
  const suggestedWeight =
    estimatedWeightFromVolume != null
      ? Math.round(Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, estimatedWeightFromVolume)))
      : weightG;
  const suggestedDurationHours =
    estimatedDurationFromVolume ?? durationHours;

  const brdParams = useMemo(() => ({
    weightG,
    printTimeHours: durationHours,
    filamentCostPerKg: selectedMaterial?.unitPrice ?? 0,
    materialWastePercent,
    materialMarkupFactor: materialMarkupFactor > 0 ? materialMarkupFactor : 1,
    machineHourlyRate,
    powerWatts,
    electricityRatePerKwh,
    wearComponents,
    laborTimeHours: effectiveLaborTimeHours,
    laborRatePerHour: laborPerHour,
    riskPercent,
    profitPercent: profitMarginPercent,
  }), [
    weightG,
    durationHours,
    selectedMaterial?.unitPrice,
    materialWastePercent,
    materialMarkupFactor,
    machineHourlyRate,
    powerWatts,
    electricityRatePerKwh,
    wearComponents,
    effectiveLaborTimeHours,
    laborPerHour,
    riskPercent,
    profitMarginPercent,
  ]);

  const brdResult = useMemo(
    () => computeCostFromBRD(brdParams),
    [brdParams]
  );
  const discountAmount =
    brdResult.finalPrice * (discountPercent / 100);
  const sellingPrice = Math.max(
    0,
    brdResult.finalPrice - discountAmount
  );

  useEffect(() => {
    if (selectedMaterial?.currency && selectedMaterial.currency.length === 3)
      setCurrencyOverride(selectedMaterial.currency.toUpperCase());
  }, [selectedMaterial?.currency]);

  useEffect(() => {
    setPrinterProfiles(getPrinterProfiles());
    setMaterialProfiles(getMaterialProfiles());
  }, []);

  const applyPrinterProfile = useCallback((profile: PrinterProfile) => {
    setMachineHourlyRate(profile.machineHourlyRate);
    setPowerWatts(profile.powerWatts);
    setElectricityRatePerKwh(profile.electricityRatePerKwh);
    setWearComponents(
      profile.wearComponents.map((w) => ({
        ...w,
        id: w.id || `wear-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }))
    );
    setLaborPerHour(profile.laborPerHour);
    setRiskPercent(profile.riskPercent);
    setSelectedPrinterProfileId(profile.id);
  }, []);

  const saveCurrentAsPrinterProfile = useCallback(() => {
    const name = window.prompt(t("profileNamePrompt"));
    if (!name?.trim()) return;
    const saved = savePrinterProfile({
      name: name.trim(),
      machineHourlyRate,
      powerWatts,
      electricityRatePerKwh,
      wearComponents,
      laborPerHour,
      riskPercent,
    });
    setPrinterProfiles(getPrinterProfiles());
    setSelectedPrinterProfileId(saved.id);
  }, [
    t,
    machineHourlyRate,
    powerWatts,
    electricityRatePerKwh,
    wearComponents,
    laborPerHour,
    riskPercent,
  ]);

  const applyMaterialProfile = useCallback((profile: MaterialProfile) => {
    setMaterialWastePercent(profile.materialWastePercent);
    setMaterialMarkupFactor(profile.materialMarkupFactor);
    setSelectedMaterialProfileId(profile.id);
  }, []);

  const saveCurrentAsMaterialProfile = useCallback(() => {
    const name = window.prompt(t("profileNamePrompt"));
    if (!name?.trim()) return;
    const saved = saveMaterialProfile({
      name: name.trim(),
      materialWastePercent,
      materialMarkupFactor,
    });
    setMaterialProfiles(getMaterialProfiles());
    setSelectedMaterialProfileId(saved.id);
  }, [t, materialWastePercent, materialMarkupFactor]);

  const exportJobName =
    fileName?.replace(/\.[^.]+$/, "") ||
    `Print job – ${new Date().toLocaleDateString()}`;
  const exportOptions = useMemo(
    () => ({
      currency: workingCurrency,
      fileName: exportJobName,
      jobName: exportJobName,
    }),
    [workingCurrency, exportJobName]
  );

  function formatAmount(amount: number, currency: string): React.ReactNode {
    if (showConverted && currency !== localeCurrency) {
      const converted = convertAmount(amount, currency, localeCurrency, rates);
      return (
        <>
          <span>
            {formatNumber(converted)} {localeCurrency}
          </span>
          <span className="text-muted-foreground text-xs ms-1">
            ({formatNumber(amount)} {currency})
          </span>
        </>
      );
    }
    return (
      <>
        {formatNumber(amount)} {currency}
      </>
    );
  }

  const handleAddToInventory = useCallback(async () => {
    setAddError(null);
    setIsAdding(true);
    try {
      const productName =
        fileName?.replace(/\.[^.]+$/, "") ||
        `Print job – ${new Date().toLocaleDateString()}`;
      const created = await inventoryService.createProduct({
        name: productName,
        unit: "pcs",
        unitPrice: Math.round(sellingPrice * 100) / 100,
        currency: workingCurrency,
        description: [
          `From Print Calculator. Cost: ${formatNumber(brdResult.adjustedSubtotal)} ${workingCurrency}; margin: ${profitMarginPercent}%.`,
          client.clientName.trim()
            ? `Client: ${client.clientName}${client.clientEmail?.trim() ? ` (${client.clientEmail})` : ""}`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      });
      await inventoryService.createMovement(created.id, {
        quantityDelta: 1,
        type: "PURCHASE",
        note: "From Print Calculator",
      });
      if (file) {
        try {
          const blob = await renderModelToImageBlob(file);
          const imageFile = new File([blob], "preview.png", {
            type: "image/png",
          });
          await inventoryService.uploadProductImage(created.id, imageFile);
        } catch {
          /* Preview image optional; product already created */
        }
      }
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/dashboard/inventory/${created.id}`);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setAddError(
        axiosError.response?.data?.error ?? "Failed to add to inventory."
      );
    } finally {
      setIsAdding(false);
    }
  }, [
    file,
    fileName,
    workingCurrency,
    sellingPrice,
    brdResult.adjustedSubtotal,
    profitMarginPercent,
    client,
    queryClient,
    router,
  ]);

  if (productsLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground text-sm mb-4">{t("noMaterials")}</p>
        <Button asChild variant="default">
          <Link href="/dashboard/inventory">{t("addToInventory")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-sm font-medium">{t("fileDrop")}</Label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="mt-2 border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm cursor-pointer hover:border-primary/50"
                onClick={() =>
                  document.getElementById("print-calc-file")?.click()
                }
              >
                <input
                  id="print-calc-file"
                  type="file"
                  accept=".stl,.3mf"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                {isParsing
                  ? "Parsing…"
                  : fileName
                    ? fileName
                    : t("selectFile")}
              </div>
              {volumeCm3 != null && (
                <p className="mt-2 text-sm">
                  {t("volume")}: {volumeCm3.toFixed(2)} cm³
                  {estimatedWeightFromVolume != null && (
                    <span className="ms-2">
                      | {t("estimatedWeight")}: {Math.round(estimatedWeightFromVolume)} g
                    </span>
                  )}
                </p>
              )}
              {parseError && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {parseError}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">{t("estimateCurrency")}</Label>
              <select
                value={workingCurrency}
                onChange={(e) => setCurrencyOverride(e.target.value)}
                disabled={selectedMaterial != null}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs mt-1">
                {t("estimateCurrencyHint")}
              </p>
            </div>

            <div>
              <ClientFields
                value={client}
                onChange={setClient}
                required={false}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">{t("printerProfile")}</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={selectedPrinterProfileId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setSelectedPrinterProfileId(id);
                    if (id) {
                      const p = printerProfiles.find((x) => x.id === id);
                      if (p) applyPrinterProfile(p);
                    }
                  }}
                  className="flex h-9 min-w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">{t("noProfile")}</option>
                  {printerProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveCurrentAsPrinterProfile}
                >
                  {t("saveAsProfile")}
                </Button>
                {selectedPrinterProfileId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deletePrinterProfile(selectedPrinterProfileId);
                      setPrinterProfiles(getPrinterProfiles());
                      setSelectedPrinterProfileId(null);
                    }}
                  >
                    {t("deleteProfile")}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">{t("material")}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {materials.map((mat) => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => setSelectedMaterial(mat)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selectedMaterial?.id === mat.id
                        ? "border-primary bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="font-medium">{mat.name}</span>
                    <span className="ms-2 text-muted-foreground">
                      {formatNumber(mat.unitPrice ?? 0)}{" "}
                      {normalizeCurrency(mat.currency)}/kg
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">{t("materialProfile")}</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={selectedMaterialProfileId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setSelectedMaterialProfileId(id);
                    if (id) {
                      const p = materialProfiles.find((x) => x.id === id);
                      if (p) applyMaterialProfile(p);
                    }
                  }}
                  className="flex h-9 min-w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">{t("noProfile")}</option>
                  {materialProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveCurrentAsMaterialProfile}
                >
                  {t("saveAsProfile")}
                </Button>
                {selectedMaterialProfileId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteMaterialProfile(selectedMaterialProfileId);
                      setMaterialProfiles(getMaterialProfiles());
                      setSelectedMaterialProfileId(null);
                    }}
                  >
                    {t("deleteProfile")}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="weight" className="text-sm font-medium">
                {t("printWeight")}
              </Label>
              <Input
                id="weight"
                type="number"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                value={weightG}
                onChange={(e) =>
                  setWeightG(
                    Math.max(
                      WEIGHT_MIN,
                      Math.min(WEIGHT_MAX, Number(e.target.value) || WEIGHT_MIN)
                    )
                  )
                }
                className="mt-1"
              />
              {estimatedWeightFromVolume != null && (
                <button
                  type="button"
                  className="text-xs text-primary mt-1"
                  onClick={() => setWeightG(suggestedWeight)}
                >
                  Use suggested {suggestedWeight} g
                </button>
              )}
            </div>

            <div>
              <Label htmlFor="duration" className="text-sm font-medium">
                {t("printDuration")}
              </Label>
              <Input
                id="duration"
                type="number"
                min={DURATION_MIN_MINUTES / 60}
                max={DURATION_MAX_HOURS}
                step={0.25}
                value={durationHours}
                onChange={(e) =>
                  setDurationHours(
                    Math.max(
                      0.5,
                      Math.min(
                        DURATION_MAX_HOURS,
                        Number(e.target.value) || 0.5
                      )
                    )
                  )
                }
                className="mt-1"
              />
              <span className="ms-2 text-sm text-muted-foreground">hrs</span>
              {estimatedDurationFromVolume != null && (
                <button
                  type="button"
                  className="text-xs text-primary mt-1 block"
                  onClick={() =>
                    setDurationHours(
                      Math.round(suggestedDurationHours * 100) / 100
                    )
                  }
                >
                  Use estimated {suggestedDurationHours.toFixed(1)} hrs
                </button>
              )}
            </div>

            <div>
              <Label htmlFor="labor" className="text-sm font-medium">
                {t("laborRateWithCurrency", { currency: workingCurrency })}
              </Label>
              <Input
                id="labor"
                type="number"
                min={0}
                step={0.5}
                value={laborPerHour}
                onChange={(e) =>
                  setLaborPerHour(Math.max(0, Number(e.target.value) || 0))
                }
                className="mt-1"
              />
              <p className="text-muted-foreground text-xs mt-1">
                {t("laborHint")}
              </p>
            </div>

            <div>
              <Label htmlFor="laborTime" className="text-sm font-medium">
                {t("laborTimeHours")}
              </Label>
              <Input
                id="laborTime"
                type="number"
                min={0}
                step={0.25}
                value={effectiveLaborTimeHours}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLaborTimeHours(Number.isFinite(v) && v >= 0 ? v : null);
                }}
                className="mt-1"
              />
              <p className="text-muted-foreground text-xs mt-1">
                {t("laborTimeHint")}
              </p>
            </div>

            <div>
              <Label htmlFor="machineRate" className="text-sm font-medium">
                {t("machineHourlyRateWithCurrency", {
                  currency: workingCurrency,
                })}
              </Label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Input
                  id="machineRate"
                  type="number"
                  min={0}
                  step={0.5}
                  value={machineHourlyRate}
                  onChange={(e) =>
                    setMachineHourlyRate(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="flex-1 min-w-[100px]"
                />
                {workingCurrency === "EGP" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMachineHourlyRate(SUGGESTED_MACHINE_HOURLY_EGP)
                    }
                  >
                    {t("useSuggested", {
                      value: SUGGESTED_MACHINE_HOURLY_EGP,
                      unit: "EGP/hr",
                    })}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="power" className="text-sm font-medium">
                {t("powerWatts")}
              </Label>
              <Input
                id="power"
                type="number"
                min={0}
                step={10}
                value={powerWatts}
                onChange={(e) =>
                  setPowerWatts(Math.max(0, Number(e.target.value) || 0))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="electricityRate" className="text-sm font-medium">
                {t("electricityRateWithCurrency", {
                  currency: workingCurrency,
                })}
              </Label>
              <Input
                id="electricityRate"
                type="number"
                min={0}
                step={0.01}
                value={electricityRatePerKwh}
                onChange={(e) =>
                  setElectricityRatePerKwh(
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="materialWaste" className="text-sm font-medium">
                {t("materialWastePercent")}
              </Label>
              <Input
                id="materialWaste"
                type="number"
                min={0}
                max={100}
                step={1}
                value={materialWastePercent}
                onChange={(e) =>
                  setMaterialWastePercent(
                    Math.max(
                      0,
                      Math.min(100, Number(e.target.value) || 0)
                    )
                  )
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="materialMarkup" className="text-sm font-medium">
                {t("materialMarkupFactor")}
              </Label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Input
                  id="materialMarkup"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={materialMarkupFactor}
                  onChange={(e) =>
                    setMaterialMarkupFactor(
                      Math.max(0.1, Number(e.target.value) || 1)
                    )
                  }
                  className="flex-1 min-w-[100px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMaterialMarkupFactor(SUGGESTED_MATERIAL_MARKUP)
                  }
                >
                  {t("useSuggestedMarkup", {
                    value: String(SUGGESTED_MATERIAL_MARKUP),
                  })}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs mt-1">
                {t("materialMarkupHint")}
              </p>
            </div>

            <div>
              <Label htmlFor="risk" className="text-sm font-medium">
                {t("riskPercent")}
              </Label>
              <Input
                id="risk"
                type="number"
                min={0}
                max={100}
                step={1}
                value={riskPercent}
                onChange={(e) =>
                  setRiskPercent(
                    Math.max(
                      0,
                      Math.min(100, Number(e.target.value) || 0)
                    )
                  )
                }
                className="mt-1"
              />
              <p className="text-muted-foreground text-xs mt-1">
                {t("riskHint")}
              </p>
            </div>

            <Collapsible defaultOpen={wearComponents.length > 0}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  {t("wearComponents")} ({wearComponents.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                {wearComponents.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-wrap items-end gap-2 rounded border p-2"
                  >
                    <div className="min-w-[100px] flex-1">
                      <Label className="text-xs">{t("wearName")}</Label>
                      <Input
                        value={w.name}
                        onChange={(e) =>
                          setWearComponents((prev) =>
                            prev.map((c) =>
                              c.id === w.id
                                ? { ...c, name: e.target.value }
                                : c
                            )
                          )
                        }
                        className="mt-1 h-8"
                        placeholder="e.g. Nozzle"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">
                        {t("wearReplacementCost")}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={w.replacementCost}
                        onChange={(e) =>
                          setWearComponents((prev) =>
                            prev.map((c) =>
                              c.id === w.id
                                ? {
                                    ...c,
                                    replacementCost: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  }
                                : c
                            )
                          )
                        }
                        className="mt-1 h-8"
                      />
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">{t("wearLifespan")}</Label>
                      <Input
                        type="number"
                        min={0.001}
                        step={1}
                        value={w.lifespanValue}
                        onChange={(e) =>
                          setWearComponents((prev) =>
                            prev.map((c) =>
                              c.id === w.id
                                ? {
                                    ...c,
                                    lifespanValue: Math.max(
                                      0.001,
                                      Number(e.target.value) || 0
                                    ),
                                  }
                                : c
                            )
                          )
                        }
                        className="mt-1 h-8"
                      />
                    </div>
                    <div className="flex gap-1">
                      <select
                        value={w.lifespanType}
                        onChange={(e) =>
                          setWearComponents((prev) =>
                            prev.map((c) =>
                              c.id === w.id
                                ? {
                                    ...c,
                                    lifespanType: e.target
                                      .value as "kg" | "hours",
                                  }
                                : c
                            )
                          )
                        }
                        className="h-8 rounded border px-2 text-xs"
                      >
                        <option value="kg">{t("wearLifespanKg")}</option>
                        <option value="hours">{t("wearLifespanHours")}</option>
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setWearComponents((prev) =>
                            prev.filter((c) => c.id !== w.id)
                          )
                        }
                        aria-label={t("removeWear")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    setWearComponents((prev) => [
                      ...prev,
                      {
                        id: nextWearId(prev),
                        name: "",
                        replacementCost: 0,
                        lifespanValue: 1,
                        lifespanType: "hours",
                      },
                    ])
                  }
                >
                  <Plus className="size-4" />
                  {t("addWearComponent")}
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <div className="rounded-md bg-muted/50 p-3 flex gap-2">
              <Info className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">
                {t("technicalNote")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium">{t("costBreakdown")}</h3>
            {showConverted && (
              <p className="text-muted-foreground text-xs mb-2">
                {t("displayConverted", { localeCurrency })}
              </p>
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>
                  {t("materialCost")}
                  {selectedMaterial && (
                    <span className="text-muted-foreground ms-1">
                      [{selectedMaterial.name}]
                    </span>
                  )}
                </dt>
                <dd>{formatAmount(brdResult.materialCost, workingCurrency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("machineCost")}</dt>
                <dd>{formatAmount(brdResult.machineCost, workingCurrency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("electricityCost")}</dt>
                <dd>
                  {formatAmount(brdResult.electricityCost, workingCurrency)}
                </dd>
              </div>
              {brdResult.wearAllocations.length > 0 && (
                <>
                  {brdResult.wearAllocations.map((w) => (
                    <div key={w.id} className="flex justify-between pl-2">
                      <dt className="text-muted-foreground">
                        {t("wearAllocation", { name: w.name })}
                      </dt>
                      <dd>
                        {formatAmount(w.allocatedCost, workingCurrency)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium">
                    <dt>{t("totalWearCost")}</dt>
                    <dd>
                      {formatAmount(brdResult.totalWearCost, workingCurrency)}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <dt>{t("laborCost")}</dt>
                <dd>{formatAmount(brdResult.laborCost, workingCurrency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("subtotal")}</dt>
                <dd>{formatAmount(brdResult.subtotal, workingCurrency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("riskBuffer")}</dt>
                <dd>{formatAmount(brdResult.riskBuffer, workingCurrency)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>{t("adjustedSubtotal")}</dt>
                <dd>
                  {formatAmount(brdResult.adjustedSubtotal, workingCurrency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("profitValue")}</dt>
                <dd>{formatAmount(brdResult.profitValue, workingCurrency)}</dd>
              </div>
            </dl>
            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between font-semibold text-base">
                <dt>{t("finalPrice")}</dt>
                <dd>{formatAmount(brdResult.finalPrice, workingCurrency)}</dd>
              </div>
              {discountPercent > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <dt>{t("discountPercent")}</dt>
                    <dd>{discountPercent}%</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt>{t("discountAmount")}</dt>
                    <dd>
                      −{formatAmount(discountAmount, workingCurrency)}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold text-base">
                <dt>{t("sellingPriceAfterDiscount")}</dt>
                <dd>{formatAmount(sellingPrice, workingCurrency)}</dd>
              </div>
              <p className="text-muted-foreground text-xs">
                {t("costPerGram")}:{" "}
                {formatAmount(brdResult.costPerGram, workingCurrency)}/g
              </p>
              <p className="text-muted-foreground text-xs">
                {t("hourlyRevenue")}:{" "}
                {formatAmount(brdResult.hourlyRevenue, workingCurrency)}/hr
              </p>
              <p className="text-muted-foreground text-xs">
                {t("marginPercent")}: {brdResult.marginPercent.toFixed(1)}%
              </p>
            </div>

            <div>
              <Label htmlFor="profit" className="text-sm font-medium">
                {t("profitMargin")}
              </Label>
              <Input
                id="profit"
                type="number"
                min={0}
                step={1}
                value={profitMarginPercent}
                onChange={(e) =>
                  setProfitMarginPercent(
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="discount" className="text-sm font-medium">
                {t("discountPercent")}
              </Label>
              <Input
                id="discount"
                type="number"
                min={0}
                max={100}
                step={1}
                value={discountPercent}
                onChange={(e) =>
                  setDiscountPercent(
                    Math.max(
                      0,
                      Math.min(100, Number(e.target.value) || 0)
                    )
                  )
                }
                className="mt-1"
              />
              <p className="text-muted-foreground text-xs mt-1">
                {t("discountHint")}
              </p>
            </div>

            {addError && (
              <p className="text-sm text-destructive" role="alert">
                {addError}
              </p>
            )}
            <Button
              className="w-full"
              type="button"
              disabled={isAdding}
              onClick={handleAddToInventory}
            >
              {isAdding ? "Adding…" : t("addToInventory")}
            </Button>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {t("exportCalculation")}:
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Download className="size-4 mr-1" />
                    {t("export")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() =>
                      downloadCalculationCSV(brdParams, brdResult, exportOptions)
                    }
                  >
                    <FileText className="size-4 mr-2" />
                    {t("exportCSV")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      downloadCalculationPDF(brdParams, brdResult, exportOptions)
                    }
                  >
                    <FileText className="size-4 mr-2" />
                    {t("exportPDF")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      printInvoice(brdParams, brdResult, exportOptions)
                    }
                  >
                    <Printer className="size-4 mr-2" />
                    {t("exportPrintInvoice")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-xs">{t("disclaimer")}</p>
      </div>
    </div>
  );
}
