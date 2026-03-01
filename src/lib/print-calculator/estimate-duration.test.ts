import { describe, it, expect } from "vitest";
import { estimatePrintDurationHours } from "./estimate-duration";

describe("estimate-duration", () => {
  it("returns positive hours for positive volume", () => {
    const hours = estimatePrintDurationHours(100);
    expect(hours).toBeGreaterThan(0);
  });

  it("uses simple rule: base 0.5h + volume/1000", () => {
    // 0.5 + 1000/1000 = 1.5
    expect(estimatePrintDurationHours(1000)).toBeCloseTo(1.5, 10);
    expect(estimatePrintDurationHours(0)).toBeCloseTo(0.5, 10);
  });
});
