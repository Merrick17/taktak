/**
 * Format a number as Tunisian Dinar currency.
 * Centralised so every admin page uses the same convention.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-TN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount) + " د.ت"
}

/** Compact version without the currency suffix (just the number). */
export function formatCurrencyValue(amount: number): string {
  return amount.toFixed(3)
}
