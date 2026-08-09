/**
 * Duck-typed extraction from raw provider payloads — works for Stripe
 * checkout sessions (amount_total), charges/payment intents (amount), and
 * provider invoices (amount_paid) without importing provider types.
 */

/**
 * Extract a non-negative integer minor-unit amount from a raw provider
 * object. Returns null when no usable integer amount is present.
 */
export function amountMinorFromRaw(raw: unknown): number | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  for (const key of ["amount_total", "amount_paid", "amount"]) {
    const value = obj[key];
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  }
  return null;
}

/** Extract an ISO-style currency code from a raw provider object, uppercased. */
export function currencyFromRaw(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null || !("currency" in raw)) return null;
  const value = raw.currency;
  return typeof value === "string" && value.length >= 2 ? value.toUpperCase() : null;
}
