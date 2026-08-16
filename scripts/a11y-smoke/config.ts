/**
 * Shared configuration for the a11y smoke gate (entry: scripts/a11y-smoke.ts).
 *
 * Loaded before every other module of the gate, so OUTPUT_DIR's timestamp
 * marks the start of the run exactly as the original single-file layout did.
 *
 * Theme passes (UI-10)
 * --------------------
 * The gate audits every page once per theme (see THEMES). Each pass runs in
 * its own browser context whose addInitScript seeds next-themes' localStorage
 * key (THEME_STORAGE_KEY) before any page script runs; next-themes' blocking
 * inline <head> script (ThemeProvider in src/app/layout.tsx, attribute
 * "data-theme", storageKey "theme") reads that key before first paint, so the
 * pass's theme is active on server-rendered and client-rendered pages alike —
 * no UI interaction needed. auditPage proves the theme actually applied
 * (documentElement[data-theme] === the pass's theme) before axe runs, and
 * fails the run loudly otherwise.
 *
 * The UI-10 detail pages resolve against the demo seed (scripts/seed-demo.ts);
 * demo-content.ts re-seeds it when missing because other suites wipe this
 * shared database (tests/demo-mode.test.ts calls seedDemo()/wipeDemo();
 * scripts/run-integration-tests.ts drops the whole volume).
 */

export const PORT = Number(process.env.A11Y_SMOKE_PORT ?? "3111");
// Pin both the dev-server bind and every URL the gate fetches to the IPv4
// loopback. Bun's fetch does not do happy-eyeballs: on hosts where
// /etc/hosts resolves `localhost` to ::1 first, fetch("http://localhost:…")
// dies instantly against an IPv4-only listener even though curl succeeds —
// the readiness loop then burns its whole 240s budget for nothing. Next
// blocks dev resources (HMR ws, manifests) requested from any origin other
// than the server's own hostname, so the spawn flag and BASE_URL must stay
// identical; 127.0.0.1 satisfies that and is loopback on every platform.
// DATABASE_URL/REDIS_URL below already stay on 127.0.0.1 because they are
// server-side connections, not browser origins.
export const BASE_URL = `http://127.0.0.1:${PORT}`;
export const ADMIN_EMAIL = "admin@nuvia.com";

// This module lives in scripts/a11y-smoke/, one directory deeper than the
// original single file, so reaching the repository root takes two steps up.
export const REPO_ROOT = import.meta.dir + "/../..";
export const OUTPUT_DIR = `/tmp/nuvia-a11y-smoke-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;

/** Test infrastructure endpoints — mirrors scripts/run-integration-tests.ts.
 *
 * DATABASE_URL/REDIS_URL respect values already present in the environment:
 * CI's browser job provides Postgres/Redis service containers on 5432/6379,
 * and hardcoding the local compose ports there made the gate raise a SECOND
 * Postgres + Redis stack on the same runner (a runner-starvation contributor
 * in runs 31930748760/31934735821). Local runs without those env vars still
 * fall back to the compose-stack ports below.
 */
export const TEST_ENV = {
  APP_URL: BASE_URL,
  BETTER_AUTH_SECRET: "local-test-secret-not-for-production-use-000000",
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://nuvia:***@127.0.0.1:15433/nuvia",
  NODE_ENV: "test",
  REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:16380",
  RATE_LIMIT_MAX_REQUESTS: "1000",
  RATE_LIMIT_WINDOW_MINUTES: "15",
  // `next dev` below forces NODE_ENV=development, which would silently
  // switch verification back to better-auth's default scrypt while the
  // seed script (NODE_ENV=test) wrote the cheap test hashes — every
  // sign-in would then throw "Invalid password hash". This explicit flag
  // keeps both sides on the same fast hash (src/lib/auth/tokens.ts).
  TEST_FAST_PASSWORD_HASH: "true",
} as const;

export const COMPOSE_COMMAND = [
  "docker",
  "compose",
  "--file",
  "compose.yml",
  "--project-name",
  "nuvia",
] as const;

/** WCAG tags covering 2.0/2.1/2.2 levels A + AA. */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export type ThemeName = "light" | "dark";

/** Passes the gate runs, in order — one full audit of every page per theme. */
export const THEMES: readonly ThemeName[] = ["light", "dark"];

/**
 * localStorage key next-themes reads/writes (storageKey on the ThemeProvider
 * in src/app/layout.tsx). Each pass's browser context seeds this key via
 * addInitScript before navigation so the pass's theme wins over the
 * headless browser's "system" preference.
 */
export const THEME_STORAGE_KEY = "theme";

export interface PageTarget {
  slug: string;
  path: string;
  module: string;
  auth: boolean;
  /**
   * UI-10 detail/empty-list pages only: text the rendered page must contain.
   * Proves the URL returned HTTP 200 and rendered its intended view (real
   * seeded content) instead of a not-found fallback — which axe would
   * happily pass, silently auditing the wrong page.
   */
  expectText?: string;
}

/**
 * One representative page per enabled module (config/features.ts module
 * flags) plus the two public listings. Finance — promoted in backlog C5 —
 * is audited on all six of its dashboard pages. See
 * docs/accessibility/wcag-2.2-aa-enabled-modules.md for the selection.
 */
export const PAGES: readonly PageTarget[] = [
  { slug: "public-events", path: "/events", module: "public", auth: false },
  { slug: "public-jobs", path: "/jobs", module: "public", auth: false },
  { slug: "public-news", path: "/news", module: "public", auth: false },
  { slug: "public-forums", path: "/forums", module: "public", auth: false },
  { slug: "public-members", path: "/members", module: "public", auth: false },
  { slug: "public-membership", path: "/membership", module: "public", auth: false },
  { slug: "public-chapters", path: "/chapters", module: "public", auth: false },
  { slug: "public-committees", path: "/committees", module: "public", auth: false },
  { slug: "public-donate", path: "/donate", module: "public", auth: false },
  // Wave B3 docs portal (UI-40)
  { slug: "public-docs", path: "/docs", module: "public", auth: false },
  { slug: "docs-users-awards", path: "/docs/users/awards", module: "public", auth: false },
  {
    slug: "docs-developers-architecture",
    path: "/docs/developers/architecture-overview",
    module: "public",
    auth: false,
  },
  {
    slug: "docs-operators-deployment",
    path: "/docs/operators/deployment-plan",
    module: "public",
    auth: false,
  },
  {
    slug: "members-directory",
    path: "/dashboard/memberships/directory",
    module: "members",
    auth: true,
  },
  { slug: "events-calendar", path: "/dashboard/events/calendar", module: "events", auth: true },
  { slug: "content-media", path: "/dashboard/content/media", module: "content", auth: true },
  { slug: "forums-categories", path: "/dashboard/forums/categories", module: "forums", auth: true },
  { slug: "jobs-board", path: "/dashboard/jobs", module: "jobs", auth: true },
  { slug: "finance-dues", path: "/dashboard/finance/dues", module: "finance", auth: true },
  { slug: "finance-invoices", path: "/dashboard/finance/invoices", module: "finance", auth: true },
  { slug: "finance-reports", path: "/dashboard/finance/reports", module: "finance", auth: true },
  { slug: "finance-budget", path: "/dashboard/finance/budget", module: "finance", auth: true },
  {
    slug: "finance-donations",
    path: "/dashboard/finance/donations",
    module: "finance",
    auth: true,
  },
  { slug: "finance-gateways", path: "/dashboard/finance/gateways", module: "finance", auth: true },
  {
    slug: "chapters-directory",
    path: "/dashboard/organization/chapters",
    module: "chapters",
    auth: true,
  },
  {
    slug: "committees-directory",
    path: "/dashboard/organization/committees",
    module: "committees",
    auth: true,
  },
  {
    slug: "learning-courses",
    path: "/dashboard/learning/courses",
    module: "learning",
    auth: true,
  },
  {
    slug: "awards-programs",
    path: "/dashboard/awards/programs",
    module: "awards",
    auth: true,
  },
  {
    slug: "workspaces-directory",
    path: "/dashboard/organization/workspaces",
    module: "workspaces",
    auth: true,
  },
  {
    slug: "learning-my-courses",
    path: "/dashboard/learning/my-courses",
    module: "learning",
    auth: true,
  },
  {
    slug: "memberships-applications",
    path: "/dashboard/memberships/applications",
    module: "memberships",
    auth: true,
  },
  {
    slug: "awards-nominate",
    path: "/dashboard/awards/nominate",
    module: "awards",
    auth: true,
  },
  { slug: "member-profile", path: "/dashboard/profile", module: "users", auth: true },
  // Wave B2 member surfaces (UI-31, UI-32, UI-34)
  { slug: "member-home", path: "/dashboard/my", module: "memberships", auth: true },
  {
    slug: "member-finance",
    path: "/dashboard/my/finance",
    module: "finance",
    auth: true,
  },
  {
    slug: "member-announcements",
    path: "/dashboard/announcements",
    module: "communications",
    auth: true,
  },
  // Phase 7 dashboard surfaces (Phase 8 guardrail item 2)
  { slug: "analytics-overview", path: "/dashboard/analytics", module: "analytics", auth: true },
  {
    slug: "settings-security",
    path: "/dashboard/settings/security",
    module: "settings",
    auth: true,
  },
  { slug: "tools-cache", path: "/dashboard/tools/cache", module: "tools", auth: true },
  { slug: "events-pricing", path: "/dashboard/events/pricing", module: "events", auth: true },
  {
    slug: "memberships-renewals",
    path: "/dashboard/memberships/renewals",
    module: "memberships",
    auth: true,
  },
  // Wave UI-10: detail pages + deliberately-empty lists. Paths resolve
  // against the demo seed (scripts/seed-demo.ts), which demo-content.ts
  // re-establishes when other suites wiped it; expectText proves each URL
  // returned 200 and rendered its intended view before axe runs.
  {
    slug: "news-detail-article",
    path: "/news/demo-welcome",
    module: "content",
    auth: false,
    expectText: "Welcome to the Nuvia demo",
  },
  {
    slug: "job-detail",
    path: "/jobs/demo-program-manager",
    module: "jobs",
    auth: false,
    expectText: "Demo Program Manager",
  },
  {
    slug: "public-jobs-empty-search",
    path: "/jobs?q=zzz-no-match",
    module: "jobs",
    auth: false,
    expectText: "No jobs match your search",
  },
  {
    // No dashboard list reads a ?q= search param from the URL; the member
    // announcement inbox is the one dashboard list driven by URL query, so
    // page=999 (an offset far past the seeded rows) is the deterministic
    // zero-row variant of the requested "?q=zzz-no-match" shape.
    slug: "dashboard-announcements-empty",
    path: "/dashboard/announcements?page=999",
    module: "communications",
    auth: true,
    expectText: "No announcements yet",
  },
];

export const SEVERITIES_FAILING: Record<string, true> = { critical: true, serious: true };

/**
 * UI-10 detail pages whose paths contain seeded row ids (random UUIDs per
 * seed run), so their paths are resolved from the database at run time by
 * demo-content.ts instead of being hardcoded here.
 */
export type DynamicPageKind = "event-detail" | "forum-thread";

export const DYNAMIC_PAGES: readonly {
  kind: DynamicPageKind;
  slug: string;
  module: string;
  auth: boolean;
  expectText: string;
}[] = [
  {
    kind: "event-detail",
    slug: "event-detail",
    module: "events",
    auth: false,
    expectText: "Demo Community Meetup",
  },
  {
    kind: "forum-thread",
    slug: "forum-thread",
    module: "forums",
    auth: false,
    expectText: "Demo: a11y smoke thread",
  },
];
