/** Display helpers for the memberships/analytics page. */

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
