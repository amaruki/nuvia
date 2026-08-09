/** Money/billing display helpers for the public funnel — never mutate values. */

/** Renders a numeric(10,2) string price without trailing zeros. */
export function formatTierPrice(price: string): string {
  const value = Number(price);
  if (Number.isNaN(value)) return price;
  return `$${value % 1 === 0 ? value.toString() : value.toFixed(2)}`;
}

/** Human label for the billing cycle shown next to the price. */
export function formatBillingPeriod(cycle: string): string {
  switch (cycle) {
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    case "lifetime":
      return "lifetime";
    default:
      return cycle;
  }
}
