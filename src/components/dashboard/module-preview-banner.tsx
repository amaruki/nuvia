import { isModuleEnabled, MODULE_LABELS, type ModuleName } from "../../../config/features";

/**
 * The one shared mock-tier banner (ADR-0008 / backlog A1). Mock-tier pages
 * do not rebuild their own warning — their section layout renders this.
 *
 * It returns null once the module's flag flips on at promotion, so removing
 * the banner is part of the flag flip itself. `flags` overrides the global
 * registry (config/features.ts) and threads through to
 * isModuleEnabled(module, flags) so callers and tests can exercise the
 * flag-off branch without mutating MODULE_FLAGS; omitting it keeps today's
 * registry behavior. Server-compatible on purpose: no hooks, no client
 * state, so section layouts can stay server components.
 */
export function ModulePreviewBanner({
  module,
  flags,
}: {
  module: ModuleName;
  flags?: Record<ModuleName, boolean>;
}) {
  if (isModuleEnabled(module, flags)) {
    return null;
  }

  return (
    <div
      data-testid="module-preview-banner"
      data-module={module}
      role="note"
      className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      <p className="font-semibold">Preview — mock data</p>
      <p className="mt-1 text-amber-950/80 dark:text-amber-100/80">
        {MODULE_LABELS[module]} has not cleared the module promotion gate yet (ADR-0008). Everything
        on this page renders from mock data — nothing is saved, and records will change or disappear
        without notice.
      </p>
    </div>
  );
}
