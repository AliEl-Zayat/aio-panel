/**
 * Estimate print duration (hours) from model volume (cm³).
 * Simple heuristic: base 0.5h + volume_cm3 / 1000.
 */

const BASE_HOURS = 0.5;
const HOURS_PER_CM3 = 1 / 1000;

export function estimatePrintDurationHours(volumeCm3: number): number {
  return BASE_HOURS + volumeCm3 * HOURS_PER_CM3;
}
