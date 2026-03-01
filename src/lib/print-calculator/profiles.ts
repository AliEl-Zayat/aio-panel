import type { WearComponentInput } from "./cost";

const PRINTER_PROFILES_KEY = "print-calculator/printer-profiles";
const MATERIAL_PROFILES_KEY = "print-calculator/material-profiles";

export interface PrinterProfile {
  id: string;
  name: string;
  machineHourlyRate: number;
  powerWatts: number;
  electricityRatePerKwh: number;
  wearComponents: WearComponentInput[];
  laborPerHour: number;
  riskPercent: number;
  createdAt: number;
}

export interface MaterialProfile {
  id: string;
  name: string;
  materialWastePercent: number;
  materialMarkupFactor: number;
  createdAt: number;
}

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getPrinterProfiles(): PrinterProfile[] {
  const list = safeParse<PrinterProfile[]>(PRINTER_PROFILES_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function savePrinterProfile(profile: Omit<PrinterProfile, "id" | "createdAt">): PrinterProfile {
  const list = getPrinterProfiles();
  const id = `printer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const created: PrinterProfile = {
    ...profile,
    id,
    createdAt: Date.now(),
  };
  list.push(created);
  safeSet(PRINTER_PROFILES_KEY, JSON.stringify(list));
  return created;
}

export function updatePrinterProfile(id: string, updates: Partial<Omit<PrinterProfile, "id" | "createdAt">>): void {
  const list = getPrinterProfiles().map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  safeSet(PRINTER_PROFILES_KEY, JSON.stringify(list));
}

export function deletePrinterProfile(id: string): void {
  const list = getPrinterProfiles().filter((p) => p.id !== id);
  safeSet(PRINTER_PROFILES_KEY, JSON.stringify(list));
}

export function getMaterialProfiles(): MaterialProfile[] {
  const list = safeParse<MaterialProfile[]>(MATERIAL_PROFILES_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveMaterialProfile(profile: Omit<MaterialProfile, "id" | "createdAt">): MaterialProfile {
  const list = getMaterialProfiles();
  const id = `material-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const created: MaterialProfile = {
    ...profile,
    id,
    createdAt: Date.now(),
  };
  list.push(created);
  safeSet(MATERIAL_PROFILES_KEY, JSON.stringify(list));
  return created;
}

export function deleteMaterialProfile(id: string): void {
  const list = getMaterialProfiles().filter((p) => p.id !== id);
  safeSet(MATERIAL_PROFILES_KEY, JSON.stringify(list));
}
