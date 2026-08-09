/**
 * Safe back navigation (UI-24 item 6).
 *
 * `router.back()` is unsafe on deep-linked event pages: a visitor arriving
 * from search, a bookmark, or a shared URL has no in-app history entry, so
 * back either leaves the site or lands on about:blank. resolveBackTarget()
 * decides whether back() can be trusted and returns the fallback route to
 * navigate to instead when it cannot.
 *
 * Rules — deliberately simple and deterministic (only facts the browser
 * exposes reliably, no SPA-history guessing):
 * - history.length <= 1 → no earlier entry exists → fallback.
 * - Empty referrer (direct navigation / bookmarks) → fallback.
 * - Cross-origin referrer → back would leave the site → fallback.
 * - Otherwise the previous entry is an in-app page → back() is safe (null).
 */

export interface BackNavigationContext {
  historyLength: number;
  referrer: string;
  origin: string;
}

export function resolveBackTarget(ctx: BackNavigationContext, fallback: string): string | null {
  if (ctx.historyLength <= 1) return fallback;
  if (!ctx.referrer) return fallback;
  try {
    if (new URL(ctx.referrer).origin !== ctx.origin) return fallback;
  } catch {
    // Unparseable referrer — treat it as external and stay on site.
    return fallback;
  }
  return null;
}
