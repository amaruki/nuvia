/**
 * Module maturity gate registry — ADR-0008 and
 * docs/technical-specs/13-module-maturity-gate.md (§13.3 shape is binding).
 *
 * A module's flag flips to `true` only at the Promoted tier (schema +
 * authorized API + tests + docs). Every tier below Promoted — Mock,
 * Backed, Tested — keeps the flag `false`. There is no partial credit.
 *
 * This file is the static-file resolution of §13.8's open question: a
 * deployer flips a flag by editing this file and redeploying.
 *
 * Kept icon-free and framework-free on purpose, the same constraint as
 * src/lib/navigation-data.ts: src/proxy.ts (Node middleware, runs on
 * every request) may import it, and React/lucide-react imports would
 * drag the wrong dependencies into that bundle.
 */

export const MODULE_NAMES = [
  "members",
  "events",
  "content",
  "forums",
  "jobs",
  "finance",
  "awards",
  "learning",
  "chapters",
  "committees",
  "workspaces",
] as const;

export type ModuleName = (typeof MODULE_NAMES)[number];

/**
 * §13.3 registry. Every module is Promoted: backing schema + authorized
 * API + tests + docs (finance promoted 2026-08-08, backlog C5,
 * docs/modules/finance.md; chapters promoted 2026-08-08, backlog D1,
 * docs/modules/chapters.md; committees promoted 2026-08-08, backlog D2,
 * docs/modules/committees.md; learning promoted 2026-08-08, backlog D3,
 * docs/modules/learning.md; awards promoted 2026-08-08, backlog D4,
 * docs/modules/awards.md; workspaces promoted 2026-08-08, backlog D5,
 * docs/modules/workspaces.md). No module remains Mock tier: the promotion
 * queue from ADR-0008 / §13.4 is fully drained.
 */
export const MODULE_FLAGS: Record<ModuleName, boolean> = {
  members: true,
  events: true,
  content: true,
  forums: true,
  jobs: true,
  finance: true,
  awards: true,
  learning: true,
  chapters: true,
  committees: true,
  workspaces: true,
};

/** Human-readable titles for UI surfaces (badge tooltips, banners). */
export const MODULE_LABELS: Record<ModuleName, string> = {
  members: "Members",
  events: "Events",
  content: "Content",
  forums: "Forums",
  jobs: "Job Board",
  finance: "Finance",
  awards: "Awards & Recognition",
  learning: "Learning & Development",
  chapters: "Chapters",
  committees: "Committees",
  workspaces: "Committee Workspaces",
};

/**
 * Whether a module ships enabled. `flags` defaults to the registry and is
 * overridable so callers (and tests) can exercise on/off behavior without
 * mutating MODULE_FLAGS.
 */
export function isModuleEnabled(
  name: ModuleName,
  flags: Record<ModuleName, boolean> = MODULE_FLAGS,
): boolean {
  return flags[name] === true;
}

/** Modules whose flag is on, in registry order. */
export function getEnabledModules(flags: Record<ModuleName, boolean> = MODULE_FLAGS): ModuleName[] {
  return MODULE_NAMES.filter((name) => isModuleEnabled(name, flags));
}

/** Modules whose flag is off, in registry order. */
export function getDisabledModules(
  flags: Record<ModuleName, boolean> = MODULE_FLAGS,
): ModuleName[] {
  return MODULE_NAMES.filter((name) => !isModuleEnabled(name, flags));
}

/**
 * Mock-marking predicate: whether a module's UI must carry a visible
 * "Preview — mock data" mark wherever it still renders (nav badge, page
 * banner). Every module has now cleared the promotion bar (finance in C5,
 * chapters/committees/learning/awards/workspaces in D1–D5), so no module
 * is flag-off and none is mock-marked. The predicate still equates
 * mock-marked with flag-off; if a module is ever flagged off again while
 * past Mock tier, it gains a tier lookup of its own. It is kept separate
 * from isModuleEnabled so that moment doesn't ripple.
 */
export function isMockMarked(
  name: ModuleName,
  flags: Record<ModuleName, boolean> = MODULE_FLAGS,
): boolean {
  return !isModuleEnabled(name, flags);
}

/**
 * Dashboard path prefix → module, per the nav-section mapping:
 * finance/awards/learning sections map to their own module; the
 * organization-structure entries map to chapters, committees, workspaces,
 * and committee budget management to finance; the five promoted sections
 * map to members/events/content/forums/jobs. Paths that belong to no
 * module (overview, user management, communications, analytics, settings,
 * tools, profile) return null and are never gated.
 */
const MODULE_PATH_PREFIXES: readonly { prefix: string; module: ModuleName }[] = [
  { prefix: "/dashboard/memberships", module: "members" },
  { prefix: "/dashboard/events", module: "events" },
  { prefix: "/dashboard/content", module: "content" },
  { prefix: "/dashboard/forums", module: "forums" },
  { prefix: "/dashboard/jobs", module: "jobs" },
  { prefix: "/dashboard/finance", module: "finance" },
  { prefix: "/dashboard/awards", module: "awards" },
  { prefix: "/dashboard/learning", module: "learning" },
  { prefix: "/dashboard/organization/chapters", module: "chapters" },
  { prefix: "/dashboard/organization/committees", module: "committees" },
  { prefix: "/dashboard/organization/workspaces", module: "workspaces" },
  { prefix: "/dashboard/organization/budget", module: "finance" },
];

/**
 * The module a dashboard pathname belongs to, or null when the path is
 * outside every module section. Matches on path-segment boundaries
 * (exact prefix or prefix + "/"), longest prefix wins.
 */
export function getModuleForPath(pathname: string): ModuleName | null {
  let best: { prefix: string; module: ModuleName } | null = null;
  for (const entry of MODULE_PATH_PREFIXES) {
    const matches = pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`);
    if (matches && (!best || entry.prefix.length > best.prefix.length)) {
      best = entry;
    }
  }
  return best?.module ?? null;
}
