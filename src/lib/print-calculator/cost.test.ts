import { describe, it, expect } from "vitest";
import {
  computeProductionCost,
  computeSellingPrice,
  computeCostFromBRD,
  type ProductionCostParams,
  type BRDCostParams,
  type WearComponentInput,
} from "./cost";

describe("print-calculator cost", () => {
  describe("computeProductionCost", () => {
    it("returns breakdown and total for given params", () => {
      const params: ProductionCostParams = {
        weightG: 100,
        durationHours: 2,
        materialPricePerKg: 25,
        laborPerHour: 25,
        lubePerHour: 1,
        energyCostPerHour: 1.05,
        failureMarginPercent: 10,
      };
      const result = computeProductionCost(params);
      expect(result).toMatchObject({
        materialCost: 2.5, // 0.1 kg * 25
        laborCost: 50, // 2 * 25
        lubeCost: 2, // 2 * 1
        energyCost: 2.1, // 2 * 1.05
      });
      const subtotal = 2.5 + 50 + 2 + 2.1;
      expect(result.failureBuffer).toBeCloseTo(subtotal * 0.1, 10);
      expect(result.total).toBeCloseTo(subtotal + result.failureBuffer, 10);
    });

    it("computes failure buffer as percent of material+energy+labor+lube", () => {
      const params: ProductionCostParams = {
        weightG: 200,
        durationHours: 1,
        materialPricePerKg: 30,
        laborPerHour: 20,
        lubePerHour: 0,
        energyCostPerHour: 2,
        failureMarginPercent: 10,
      };
      const result = computeProductionCost(params);
      // material 0.2*30=6, labor 20, energy 2, lube 0 → subtotal 28, buffer 2.8, total 30.8
      expect(result.materialCost).toBe(6);
      expect(result.laborCost).toBe(20);
      expect(result.energyCost).toBe(2);
      expect(result.lubeCost).toBe(0);
      expect(result.failureBuffer).toBeCloseTo(2.8, 10);
      expect(result.total).toBeCloseTo(30.8, 10);
    });
  });

  describe("computeSellingPrice", () => {
    it("returns totalCost * (1 + profitMarginPercent/100)", () => {
      expect(computeSellingPrice(100, 0)).toBe(100);
      expect(computeSellingPrice(100, 10)).toBeCloseTo(110, 10);
      expect(computeSellingPrice(49.39, 25)).toBeCloseTo(61.7375, 10);
    });
  });

  describe("computeCostFromBRD", () => {
    it("computes material with waste and optional markup", () => {
      const params: BRDCostParams = {
        weightG: 100,
        printTimeHours: 1,
        filamentCostPerKg: 20,
        materialWastePercent: 10,
        materialMarkupFactor: 1,
        machineHourlyRate: 5,
        powerWatts: 200,
        electricityRatePerKwh: 0.15,
        wearComponents: [],
        laborTimeHours: 1,
        laborRatePerHour: 25,
        riskPercent: 0,
        profitPercent: 0,
      };
      const r = computeCostFromBRD(params);
      expect(r.materialCost).toBeCloseTo((110 / 1000) * 20, 10);
      expect(r.machineCost).toBe(5);
      expect(r.electricityCost).toBeCloseTo(0.2 * 1 * 0.15, 10);
      expect(r.laborCost).toBe(25);
      expect(r.wearAllocations).toHaveLength(0);
      expect(r.totalWearCost).toBe(0);
      expect(r.riskBuffer).toBe(0);
    });

    it("allocates wear by kg and by hours", () => {
      const wear: WearComponentInput[] = [
        { id: "1", name: "Nozzle", replacementCost: 50, lifespanValue: 500, lifespanType: "kg" },
        { id: "2", name: "Belt", replacementCost: 20, lifespanValue: 500, lifespanType: "hours" },
      ];
      const params: BRDCostParams = {
        weightG: 1000,
        printTimeHours: 10,
        filamentCostPerKg: 25,
        materialWastePercent: 0,
        machineHourlyRate: 0,
        powerWatts: 0,
        electricityRatePerKwh: 0,
        wearComponents: wear,
        laborTimeHours: 10,
        laborRatePerHour: 0,
        riskPercent: 0,
        profitPercent: 0,
      };
      const r = computeCostFromBRD(params);
      expect(r.wearAllocations[0].allocatedCost).toBeCloseTo(50 / (500 * 1000) * 1000, 10);
      expect(r.wearAllocations[1].allocatedCost).toBeCloseTo(20 / 500 * 10, 10);
    });

    it("applies risk and profit to get final price", () => {
      const params: BRDCostParams = {
        weightG: 100,
        printTimeHours: 2,
        filamentCostPerKg: 25,
        materialWastePercent: 0,
        machineHourlyRate: 10,
        powerWatts: 100,
        electricityRatePerKwh: 0.2,
        wearComponents: [],
        laborTimeHours: 2,
        laborRatePerHour: 25,
        riskPercent: 10,
        profitPercent: 25,
      };
      const r = computeCostFromBRD(params);
      const subtotal = r.materialCost + r.machineCost + r.electricityCost + r.laborCost;
      expect(r.subtotal).toBeCloseTo(subtotal, 10);
      expect(r.adjustedSubtotal).toBeCloseTo(r.subtotal + r.riskBuffer, 10);
      expect(r.finalPrice).toBeCloseTo(r.adjustedSubtotal * 1.25, 10);
      expect(r.costPerGram).toBeCloseTo(r.finalPrice / 100, 10);
      expect(r.hourlyRevenue).toBeCloseTo(r.finalPrice / 2, 10);
    });
  });
});
