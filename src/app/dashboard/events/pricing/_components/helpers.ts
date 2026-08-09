/** Display helpers for the events/pricing page (house style: per-page helpers). */

export function formatCurrency(amount: string | number, currency: string): string {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return String(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    // Unknown ISO code in organization.currency — fall back to a plain label.
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
