import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * UI-23: analytics section rebuild — six server-component pages backed by
 * real read-only services, client chart islands, honest empty states, and
 * navigation-data role gates. Static checks against the source files, in
 * the style of the other tests/ structural suites.
 */

const ROOT = join(import.meta.dir, "..");

function readSource(...parts: string[]): string {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

const PAGES = [
  "src/app/dashboard/analytics/page.tsx",
  "src/app/dashboard/analytics/content/page.tsx",
  "src/app/dashboard/analytics/custom/page.tsx",
  "src/app/dashboard/analytics/events/page.tsx",
  "src/app/dashboard/analytics/financial/page.tsx",
  "src/app/dashboard/analytics/members/page.tsx",
];

const CHILD_PAGE_PATHS = [
  "/dashboard/analytics/content",
  "/dashboard/analytics/custom",
  "/dashboard/analytics/events",
  "/dashboard/analytics/financial",
  "/dashboard/analytics/members",
];

const DATA_SERVICES = [
  "src/lib/services/analytics-content.ts",
  "src/lib/services/analytics-events.ts",
  "src/lib/services/analytics-financial.ts",
  "src/lib/services/analytics-members.ts",
];

const RANGE_HELPER = "src/lib/services/analytics-range.ts";

const CHART_ISLANDS = [
  "src/components/analytics/bar-list-chart.tsx",
  "src/components/analytics/breakdown-chart.tsx",
  "src/components/analytics/trend-chart.tsx",
];

const SERVER_COMPONENTS = [
  ...PAGES,
  "src/app/dashboard/analytics/loading.tsx",
  "src/app/dashboard/analytics/_lib/access.ts",
  "src/components/analytics/analytics-gate-notice.tsx",
  "src/components/analytics/index.ts",
  "src/components/analytics/range-filter.tsx",
  "src/components/analytics/stat-card.tsx",
];

describe("analytics pages exist and stay server components", () => {
  test("all six pages and the loading skeleton exist", () => {
    for (const page of [...PAGES, "src/app/dashboard/analytics/loading.tsx"]) {
      expect(readSource(page).length).toBeGreaterThan(0);
    }
  });

  test("no analytics page opts into client rendering", () => {
    for (const file of SERVER_COMPONENTS) {
      expect(readSource(file)).not.toContain('"use client"');
    }
  });

  test("every page opts out of static prerendering", () => {
    for (const page of PAGES) {
      expect(readSource(page)).toContain('export const dynamic = "force-dynamic"');
    }
  });
});

describe("pages read real aggregates through the analytics services", () => {
  const PAGE_SERVICE_IMPORTS: Record<string, string> = {
    "src/app/dashboard/analytics/page.tsx": "@/lib/services/analytics-content",
    "src/app/dashboard/analytics/content/page.tsx": "@/lib/services/analytics-content",
    "src/app/dashboard/analytics/events/page.tsx": "@/lib/services/analytics-events",
    "src/app/dashboard/analytics/financial/page.tsx": "@/lib/services/analytics-financial",
    "src/app/dashboard/analytics/members/page.tsx": "@/lib/services/analytics-members",
    "src/app/dashboard/analytics/custom/page.tsx": "@/lib/services/analytics-content",
  };

  test("each page imports its read-only analytics service", () => {
    for (const [page, serviceImport] of Object.entries(PAGE_SERVICE_IMPORTS)) {
      expect(readSource(page)).toContain(serviceImport);
    }
  });

  test("the custom page applies the range window to every aggregate", () => {
    const custom = readSource("src/app/dashboard/analytics/custom/page.tsx");
    expect(custom).toContain("@/lib/services/analytics-events");
    expect(custom).toContain("@/lib/services/analytics-members");
    expect(custom).toContain("@/lib/services/analytics-financial");
    expect(custom).toContain("parseAnalyticsRange");
    expect(custom).toContain("await searchParams");
  });

  test("data services compute from the database, never hardcoded rows", () => {
    for (const service of DATA_SERVICES) {
      const source = readSource(service);
      expect(source).toContain("@/db/client");
      expect(source).not.toContain("db.insert");
      expect(source).not.toContain("db.update");
      expect(source).not.toContain("db.delete");
    }
  });

  test("the range helper owns the 30/90/365 window parsing", () => {
    const range = readSource(RANGE_HELPER);
    expect(range).toContain("parseAnalyticsRange");
    expect(range).not.toContain("@/db/client");
  });

  test("the financial service reuses the finance-report aggregates", () => {
    const financial = readSource("src/lib/services/analytics-financial.ts");
    expect(financial).toContain("getRevenueByPeriod");
    expect(financial).toContain("getOutstandingSummary");
    expect(financial).toContain("getDonationCapability");
  });
});

describe("no fabricated numbers anywhere in the new surface", () => {
  test("no placeholder data tokens in pages, components, services, or tests", () => {
    const files = [
      ...PAGES,
      ...DATA_SERVICES,
      RANGE_HELPER,
      ...CHART_ISLANDS,
      ...SERVER_COMPONENTS,
    ];
    for (const file of new Set(files)) {
      const source = readSource(file).toLowerCase();
      expect(source).not.toContain("mock");
      expect(source).not.toContain("fake");
      expect(source).not.toContain("sample");
      expect(source).not.toContain("lorem");
      expect(source).not.toContain("placeholder data");
    }
  });
});

describe("chart islands are client components themed with --chart-* tokens", () => {
  test("each chart island opts into client rendering and uses the chart primitives", () => {
    for (const island of CHART_ISLANDS) {
      const source = readSource(island);
      expect(source).toContain('"use client"');
      expect(source).toContain("recharts");
      expect(source).toContain("ChartContainer");
      expect(source).toContain("var(--chart-");
    }
  });
});

describe("honest empty states", () => {
  test("every child page and the custom page render EmptyState for zero rows", () => {
    for (const page of PAGES.slice(1)) {
      const source = readSource(page);
      expect(source).toContain("EmptyState");
      expect(source).toContain("@/components/ui/empty-state");
    }
  });

  test("the gate notice also uses EmptyState instead of blank screens", () => {
    const notice = readSource("src/components/analytics/analytics-gate-notice.tsx");
    expect(notice).toContain("EmptyState");
  });
});

describe("permission gates follow navigation-data roles", () => {
  test("every page runs the shared navigation-data gate", () => {
    for (const page of PAGES) {
      const source = readSource(page);
      expect(source).toContain("requireAnalyticsAccess");
      expect(source).toContain("AnalyticsGateNotice");
    }
  });

  test("the gate reads navigation-data role lists, not the analytics:read permission", () => {
    const access = readSource("src/app/dashboard/analytics/_lib/access.ts");
    expect(access).toContain("isRoleAllowedForPath");
    expect(access).toContain("getRequiredRolesForPath");
    expect(access).not.toContain("analytics:read");
    for (const page of PAGES) {
      expect(readSource(page)).not.toContain("hasPermission");
    }
  });

  test("navigation-data still names a role list for every analytics path", () => {
    const nav = readSource("src/lib/navigation-data/analytics.ts");
    for (const path of ["/dashboard/analytics", ...CHILD_PAGE_PATHS]) {
      expect(nav).toContain(`path: "${path}"`);
    }
    expect(nav).toContain("roles:");
  });
});

describe("root page links to all five sections", () => {
  test("root lists every child path", () => {
    const root = readSource("src/app/dashboard/analytics/page.tsx");
    for (const path of CHILD_PAGE_PATHS) {
      expect(root).toContain(path);
    }
  });
});

describe("custom report range filter", () => {
  test("the filter offers exactly the 30/90/365 windows", () => {
    const filter = readSource("src/components/analytics/range-filter.tsx");
    expect(filter).toContain("ANALYTICS_RANGE_DAYS");
    expect(filter).toContain("?range=");
    const range = readSource("src/lib/services/analytics-range.ts");
    expect(range).toContain("[30, 90, 365]");
    expect(range).toContain("DEFAULT_ANALYTICS_RANGE_DAYS: AnalyticsRangeDays = 90");
  });
});

describe("loading skeleton covers the analytics layout", () => {
  test("loading.tsx renders Skeleton placeholders for header, KPIs, and charts", () => {
    const loading = readSource("src/app/dashboard/analytics/loading.tsx");
    expect(loading).toContain("Skeleton");
    expect(loading).toContain("export default function AnalyticsLoading");
  });
});
