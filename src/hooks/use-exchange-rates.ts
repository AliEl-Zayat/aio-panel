"use client";

import { useQuery } from "@tanstack/react-query";

const RATES_URL = "https://api.frankfurter.dev/latest?from=USD";

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
}

async function fetchRates(): Promise<ExchangeRatesData> {
  const res = await fetch(RATES_URL);
  if (!res.ok) throw new Error("Failed to fetch exchange rates");
  const data = (await res.json()) as { base: string; rates: Record<string, number> };
  return { base: data.base, rates: { USD: 1, ...data.rates } };
}

export function useExchangeRates(enabled = true) {
  return useQuery({
    queryKey: ["exchange-rates"],
    queryFn: fetchRates,
    enabled: typeof window !== "undefined" && enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
