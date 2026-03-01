export interface ProductionCostParams {
  weightG: number;
  durationHours: number;
  materialPricePerKg: number;
  laborPerHour: number;
  lubePerHour: number;
  energyCostPerHour: number;
  failureMarginPercent: number;
}

export interface ProductionCostResult {
  materialCost: number;
  energyCost: number;
  laborCost: number;
  lubeCost: number;
  failureBuffer: number;
  total: number;
}

/** BRD: wear component – lifespan in kg or hours */
export interface WearComponentInput {
  id: string;
  name: string;
  replacementCost: number;
  lifespanValue: number;
  lifespanType: "kg" | "hours";
}

/** BRD: full parametric cost model inputs */
export interface BRDCostParams {
  /** Print weight (g) */
  weightG: number;
  /** Print time (hours) */
  printTimeHours: number;
  /** Filament cost per kg */
  filamentCostPerKg: number;
  /** Material waste percentage (e.g. 10 = 10%) */
  materialWastePercent: number;
  /** Optional material markup factor (e.g. 1.1 = 10% markup) */
  materialMarkupFactor?: number;
  /** Machine hourly operating rate */
  machineHourlyRate: number;
  /** Power consumption (W) */
  powerWatts: number;
  /** Electricity rate ($/kWh) */
  electricityRatePerKwh: number;
  /** Wear components */
  wearComponents: WearComponentInput[];
  /** Labor time (hours) – can differ from print time */
  laborTimeHours: number;
  /** Labor rate per hour */
  laborRatePerHour: number;
  /** Risk/failure factor (e.g. 10 = 10%) */
  riskPercent: number;
  /** Profit margin (e.g. 25 = 25%) */
  profitPercent: number;
}

/** BRD: itemized wear allocation */
export interface WearAllocationItem {
  id: string;
  name: string;
  allocatedCost: number;
}

/** BRD: full cost result */
export interface BRDCostResult {
  materialCost: number;
  machineCost: number;
  electricityCost: number;
  wearAllocations: WearAllocationItem[];
  totalWearCost: number;
  laborCost: number;
  subtotal: number;
  riskBuffer: number;
  adjustedSubtotal: number;
  profitValue: number;
  finalPrice: number;
  costPerGram: number;
  hourlyRevenue: number;
  marginPercent: number;
}

export function computeProductionCost(
  params: ProductionCostParams
): ProductionCostResult {
  const {
    weightG,
    durationHours,
    materialPricePerKg,
    laborPerHour,
    lubePerHour,
    energyCostPerHour,
    failureMarginPercent,
  } = params;

  const materialCost = (weightG / 1000) * materialPricePerKg;
  const laborCost = durationHours * laborPerHour;
  const lubeCost = durationHours * lubePerHour;
  const energyCost = durationHours * energyCostPerHour;
  const subtotal = materialCost + energyCost + laborCost + lubeCost;
  const failureBuffer = subtotal * (failureMarginPercent / 100);
  const total = subtotal + failureBuffer;

  return {
    materialCost,
    energyCost,
    laborCost,
    lubeCost,
    failureBuffer,
    total,
  };
}

export function computeSellingPrice(
  totalCost: number,
  profitMarginPercent: number
): number {
  return totalCost * (1 + profitMarginPercent / 100);
}

/**
 * BRD: Compute full cost from parametric model.
 * Final Price = (Material + Machine + Electricity + Maintenance + Labor) × (1 + Risk%) × (1 + Profit%)
 */
export function computeCostFromBRD(params: BRDCostParams): BRDCostResult {
  const {
    weightG,
    printTimeHours,
    filamentCostPerKg,
    materialWastePercent,
    materialMarkupFactor = 1,
    machineHourlyRate,
    powerWatts,
    electricityRatePerKwh,
    wearComponents,
    laborTimeHours,
    laborRatePerHour,
    riskPercent,
    profitPercent,
  } = params;

  const materialUsedG = weightG * (1 + materialWastePercent / 100);
  let materialCost =
    (filamentCostPerKg / 1000) * materialUsedG;
  if (materialMarkupFactor > 0) {
    materialCost *= materialMarkupFactor;
  }

  const machineCost = printTimeHours * machineHourlyRate;
  const electricityCost =
    (powerWatts / 1000) * printTimeHours * electricityRatePerKwh;

  const wearAllocations: WearAllocationItem[] = wearComponents.map((w) => {
    let allocated: number;
    if (w.lifespanType === "kg") {
      const costPerGram = w.lifespanValue > 0 ? w.replacementCost / (w.lifespanValue * 1000) : 0;
      allocated = costPerGram * weightG;
    } else {
      const costPerHour = w.lifespanValue > 0 ? w.replacementCost / w.lifespanValue : 0;
      allocated = costPerHour * printTimeHours;
    }
    return { id: w.id, name: w.name, allocatedCost: allocated };
  });
  const totalWearCost = wearAllocations.reduce((s, w) => s + w.allocatedCost, 0);

  const laborCost = laborTimeHours * laborRatePerHour;

  const subtotal =
    materialCost + machineCost + electricityCost + totalWearCost + laborCost;
  const riskBuffer = subtotal * (riskPercent / 100);
  const adjustedSubtotal = subtotal + riskBuffer;
  const profitValue = adjustedSubtotal * (profitPercent / 100);
  const finalPrice = adjustedSubtotal * (1 + profitPercent / 100);

  const costPerGram = weightG > 0 ? finalPrice / weightG : 0;
  const hourlyRevenue = printTimeHours > 0 ? finalPrice / printTimeHours : 0;
  const marginPercent = finalPrice > 0 ? (profitValue / finalPrice) * 100 : 0;

  return {
    materialCost,
    machineCost,
    electricityCost,
    wearAllocations,
    totalWearCost,
    laborCost,
    subtotal,
    riskBuffer,
    adjustedSubtotal,
    profitValue,
    finalPrice,
    costPerGram,
    hourlyRevenue,
    marginPercent,
  };
}
