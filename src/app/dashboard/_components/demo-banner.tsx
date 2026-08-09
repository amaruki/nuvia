/* oxlint-disable jsx-a11y/prefer-tag-over-role — a status banner is not form output. */
import { isDemoMode } from "@/lib/env";

/**
 * Demo-instance banner (UI-39, stage 3). Rendered by src/app/dashboard/
 * layout.tsx above the client shell, so it appears on EVERY dashboard page
 * without each page opting in. Server component on purpose: the flag is read
 * per request from DEMO_MODE (via the lazy isDemoMode()), never baked into a
 * client bundle.
 *
 * States that data resets daily — the same promise the landing hero/footer
 * make, and the reason the demo credential rotates on every reset.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    >
      <strong>Demo instance.</strong> Everything here is sample data and resets daily.
    </div>
  );
}
