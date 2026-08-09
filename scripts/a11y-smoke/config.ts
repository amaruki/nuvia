/**
 * Shared configuration for the a11y smoke gate (entry: scripts/a11y-smoke.ts).
 *
 * Loaded before every other module of the gate, so OUTPUT_DIR's timestamp
 * marks the start of the run exactly as the original single-file layout did.
 */

export const PORT = Number(process.env.A11Y_SMOKE_PORT ?? "3111");
export const BASE_URL = `http://127.0.0.1:${PORT}`;
export const ADMIN_EMAIL = "admin@nuvia.com";

// This module lives in scripts/a11y-smoke/, one directory deeper than the
// original single file, so reaching the repository root takes two steps up.
export const REPO_ROOT = import.meta.dir + "/../..";
export const OUTPUT_DIR = `/tmp/nuvia-a11y-smoke-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;

/** Test infrastructure endpoints — mirrors scripts/run-integration-tests.ts. */
export const TEST_ENV = {
  APP_URL: BASE_URL,
  BETTER_AUTH_SECRET: "local-test-secret-not-for-production-use-000000",
  DATABASE_URL: "postgresql://nuvia:nuvia@127.0.0.1:15433/nuvia",
  NODE_ENV: "test",
  REDIS_URL: "redis://127.0.0.1:16380",
  RATE_LIMIT_MAX_REQUESTS: "1000",
  RATE_LIMIT_WINDOW_MINUTES: "15",
} as const;

export const COMPOSE_COMMAND = [
  "docker",
  "compose",
  "--file",
  "compose.test.yml",
  "--project-name",
  "nuvia-test",
] as const;

/** WCAG tags covering 2.0/2.1/2.2 levels A + AA. */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * One representative page per enabled module (config/features.ts module
 * flags) plus the two public listings. Finance — promoted in backlog C5 —
 * is audited on all six of its dashboard pages. See
 * docs/accessibility/wcag-2.2-aa-enabled-modules.md for the selection.
 */
export const PAGES = [
  { slug: "public-events", path: "/events", module: "public", auth: false },
  { slug: "public-jobs", path: "/jobs", module: "public", auth: false },
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
] as const;

export const SEVERITIES_FAILING: Record<string, true> = { critical: true, serious: true };
