/**
 * UI-23 — display helpers for settings/payments. Formats real stored
 * values only — amounts are numeric(10,2) strings end to end (ADR-0015
 * §5), never floats, never fabricated.
 */

/** "12.00" → "$12.00"; non-USD currencies render as an ISO prefix. */
export function formatMoney(amount: string, currency = "USD"): string {
  return currency.toUpperCase() === "USD" ? `$${amount}` : `${currency.toUpperCase()} ${amount}`;
}

/** ISO timestamp → "Aug 9, 2026"; null renders as a dash. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
