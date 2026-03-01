/**
 * Locale to default ISO 4217 currency code (for "convert to locale currency").
 */
const LOCALE_TO_CURRENCY: Record<string, string> = {
  en: "USD",
  "en-US": "USD",
  "en-GB": "GBP",
  ar: "EGP",
  "ar-EG": "EGP",
  "ar-SA": "SAR",
  de: "EUR",
  "de-DE": "EUR",
  fr: "EUR",
  "fr-FR": "EUR",
};

export function getCurrencyForLocale(locale: string): string {
  return LOCALE_TO_CURRENCY[locale] ?? LOCALE_TO_CURRENCY[locale.slice(0, 2)] ?? "USD";
}

/** Common currencies for dropdowns (code + label). */
export const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "EGP", label: "EGP" },
  { value: "SAR", label: "SAR" },
  { value: "JPY", label: "JPY" },
  { value: "CHF", label: "CHF" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
];

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

/**
 * Convert amount from one currency to another using rates (base USD).
 * Frankfurter returns rates where 1 USD = rates[C] in currency C.
 * So amount_in_target = amount_source * (rates[target] / rates[source]).
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency] ?? (fromCurrency === "USD" ? 1 : undefined);
  const toRate = rates[toCurrency] ?? (toCurrency === "USD" ? 1 : undefined);
  if (fromRate == null || toRate == null) return amount;
  return (amount * toRate) / fromRate;
}
