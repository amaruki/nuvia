/**
 * Page-level token sweep guards (E1bPages workstream).
 *
 * E1bPages owns page-level hardcoded-palette decoration and loading chrome:
 * hero/CTA gradients, decorative icon chips, status-adjacent metric colors,
 * and the dashboard content skeleton. These guards pin the swept surface to
 * design tokens (primary/accent/muted/chart-*, success/warning/info).
 *
 * Conventions:
 * - Assertions are pattern-based on className content only.
 * - Status-badge CLASS MAP registries (committee/workspace type badge maps,
 *   user status/role maps, membership tier maps, email templates) are left
 *   for E1aTokens centralization and are intentionally NOT listed here.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function src(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// (a) No legacy gray surface pairs anywhere under src/
// ---------------------------------------------------------------------------

const LEGACY_SURFACE_PATTERNS = [
  /bg-white\s+dark:bg-gray/,
  /dark:bg-gray-800\b/,
  /dark:bg-gray-700\b/,
];

describe("no legacy gray surface pairs under src/", () => {
  const files = walk(join(ROOT, "src")).filter((file) => /\.(ts|tsx|css)$/.test(file));

  for (const pattern of LEGACY_SURFACE_PATTERNS) {
    test(`zero matches for ${pattern}`, () => {
      const hits = files
        .filter((file) => pattern.test(readFileSync(file, "utf8")))
        .map((file) => file.slice(ROOT.length + 1));
      expect(hits).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// (b) Swept page files carry no blue/purple palette
// ---------------------------------------------------------------------------

const SWEPT_PAGE_FILES = [
  // Public marketing pages (hero h1 gradients + CTA bands)
  "src/app/(public)/chapters/page.tsx",
  "src/app/(public)/chapters/[id]/page.tsx",
  "src/app/(public)/committees/page.tsx",
  "src/app/(public)/committees/[id]/page.tsx",
  "src/app/(public)/forums/page.tsx",
  "src/app/(public)/news/page.tsx",
  "src/app/(public)/jobs/page.tsx",
  "src/app/(public)/jobs/[id]/page.tsx",
  "src/app/dashboard/jobs/page.tsx",
  // Events dashboard components
  "src/app/(public)/events/dashboard/_components/my-events-card.tsx",
  "src/app/(public)/events/dashboard/_components/statistics-cards.tsx",
  "src/app/(public)/events/dashboard/_components/upcoming-events-card.tsx",
  // Loading chrome + dashboard widgets
  "src/components/dashboard/loading/dashboard-content-skeleton.tsx",
  "src/components/dashboard/widgets/upcoming-events-widget.tsx",
  "src/components/dashboard/widgets/user-profile-widget.tsx",
  "src/components/dashboard/widgets/certificates-widget.tsx",
  // Dashboard metric cards
  "src/app/dashboard/awards/programs/_components/program-stats-cards.tsx",
  "src/app/dashboard/content/announcements/_components/overview-tab.tsx",
  "src/app/dashboard/content/articles/[id]/_components/article-metrics-card.tsx",
  "src/app/dashboard/content/media/_components/stats-overview.tsx",
  "src/app/dashboard/content/publications/[id]/_components/publication-metrics-card.tsx",
  "src/app/dashboard/organization/committees/[id]/_components/committee-quick-stats.tsx",
  "src/app/dashboard/organization/workspaces/[id]/_components/overview-tab.tsx",
  "src/app/dashboard/organization/workspaces/[id]/_components/workspace-stats.tsx",
  "src/components/chapters/chapters-overview-cards/stat-cards.tsx",
  "src/components/committees/committees-overview-cards.tsx",
  // Content overview-card families
  "src/components/content/announcements-overview-cards/key-metrics-cards.tsx",
  "src/components/content/articles-overview-cards/stat-cards.tsx",
  "src/components/content/publications-overview-cards/stat-cards.tsx",
  "src/components/content/media-overview-cards/stat-cards.tsx",
  "src/components/content/media-overview-cards/helpers.tsx",
  "src/components/content/media-analytics/overview-tab.tsx",
  "src/components/content/media-analytics/helpers.tsx",
  "src/components/finance/gateways-overview-cards/stat-cards.tsx",
  "src/components/finance/reports-overview-cards.tsx",
  "src/components/workspaces/workspaces-overview-cards/stat-cards.tsx",
  // Certificates, calendar variants, roles
  // NOTE: announcement-banner.tsx (getBannerColor type map) and
  // media-permissions-manager/helpers.tsx (getPermissionColor badge map)
  // carry status/type badge CLASS MAPs — left for E1aTokens centralization.
  "src/components/events/event-certificate.tsx",
  "src/components/ui/full-calendar/event-variants.ts",
  "src/components/roles/role-statistics/overview-cards.tsx",
  // Explicitly named dashboard pages
  "src/app/dashboard/content/media/analytics/page.tsx",
  "src/app/dashboard/active-devices/page.tsx",
];

describe("swept page files carry no blue/purple palette", () => {
  for (const file of SWEPT_PAGE_FILES) {
    test(`${file}: zero bg-purple-/text-purple-/from-blue-/to-purple-`, () => {
      const source = src(file);
      expect(source).not.toMatch(/bg-purple-/);
      expect(source).not.toMatch(/text-purple-/);
      expect(source).not.toMatch(/from-blue-/);
      expect(source).not.toMatch(/to-purple-/);
    });
  }

  test("my-events-card banner gradient is fully tokenized (no indigo tail)", () => {
    const source = src("src/app/(public)/events/dashboard/_components/my-events-card.tsx");
    expect(source).not.toMatch(/to-indigo-/);
  });

  test("media analytics page loading chrome drops raw white/blue", () => {
    const source = src("src/app/dashboard/content/media/analytics/page.tsx");
    expect(source).not.toMatch(/bg-white\b/);
    expect(source).not.toMatch(/border-blue-\d/);
  });
});

// ---------------------------------------------------------------------------
// (c) Dashboard content skeleton rides the Skeleton primitive
// ---------------------------------------------------------------------------

describe("dashboard-content-skeleton rides the Skeleton primitive", () => {
  const source = src("src/components/dashboard/loading/dashboard-content-skeleton.tsx");

  test("imports the Skeleton primitive", () => {
    expect(source).toMatch(/import\s*\{\s*Skeleton\s*\}\s*from\s*"@\/components\/ui\/skeleton"/);
  });

  test("renders Skeleton elements", () => {
    expect(source).toMatch(/<Skeleton\b/);
  });

  test("no hardcoded white/gray surfaces remain", () => {
    expect(source).not.toMatch(/bg-white\b/);
    expect(source).not.toMatch(/bg-gray-\d/);
  });
});

// ---------------------------------------------------------------------------
// (d) Member statistics widget: no inline color styles, no purple vars
// ---------------------------------------------------------------------------

describe("member-statistics-widget carries no inline color styles", () => {
  const source = src("src/components/dashboard/widgets/member-statistics-widget.tsx");

  test("no inline style color declarations", () => {
    expect(source).not.toMatch(/style=\{\{[^}]*\bcolor\b[^}]*\}\}/);
  });

  test("no var(--purple-*) references", () => {
    expect(source).not.toMatch(/var\(--purple-\d+\)/);
  });
});
