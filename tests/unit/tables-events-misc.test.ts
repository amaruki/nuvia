/**
 * UI-09 table remediation guard for the events + misc modules
 * (docs/planning/03-frontend-improvement-plan.md): event registrations and
 * the membership directory paginate server-side with their silent caps
 * removed, the awards/forum/auth/learning list surfaces render through the
 * shared DataTable layer, and the card-based membership directory keeps its
 * paradigm while swapping load-more for the shared pagination primitive.
 *
 * Structural assertions only (existsSync/readFileSync + regex) so the test
 * never executes React.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");

function read(relPath: string): string {
  const abs = join(ROOT, relPath);
  expect(existsSync(abs), `missing file: ${relPath}`).toBe(true);
  return readFileSync(abs, "utf8");
}

/**
 * Exported identifiers of a module, parsed structurally (no import, so the
 * test never executes React). Covers `export function|const|type|interface`
 * and `export { A, type B, C as D }` lists (including re-exports).
 */
function exportedNames(source: string): Set<string> {
  const names = new Set<string>();
  const declarations =
    /export\s+(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of source.matchAll(declarations)) {
    names.add(match[1]);
  }
  const lists = /export\s+(?:type\s+)?\{([^}]+)\}/g;
  for (const match of source.matchAll(lists)) {
    for (const item of match[1].split(",")) {
      const name = item
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

describe("UI-09: event registrations — server-paginated DataTable (Tier A)", () => {
  const page = read("src/app/dashboard/events/registrations/page.tsx");

  test("renders through the shared DataTable layer", () => {
    expect(page).toContain('from "@/components/data-table"');
    expect(page).toContain("DataTable");
    expect(page).toContain("useDataTableState");
    expect(page).toContain("DataTableSearch");
    expect(page).toContain("DataTableFacetedFilter");
    expect(page).toContain("DataTablePagination");
  });

  test("drives pagination/filtering server-side (manual modes)", () => {
    expect(page).toContain("manualFiltering");
    expect(page).toContain("fetchEventRegistrations(");
    // Server query carries page + limit; no silent cap remains.
    expect(page).toMatch(/fetchEventRegistrations\([^)]*\{[^}]*page:/);
    expect(page).toMatch(/fetchEventRegistrations\([^)]*\{[^}]*limit:/);
    expect(page).not.toContain("limit: 100");
    expect(page).not.toContain('from "@/components/ui/table"');
  });

  test("keeps the AlertDialog cancel-with-reason flow", () => {
    expect(page).toContain('from "@/components/ui/alert-dialog"');
    expect(page).toContain("AlertDialogTitle");
    expect(page).toContain("cancelEventRegistrationAdmin");
  });

  test("registrations client API keeps the paginated contract", () => {
    const api = read("src/app/dashboard/events/_lib/registrations-api.ts");
    expect(api).toContain("export async function fetchEventRegistrations");
    expect(api).toMatch(/page\?:\s*number/);
    expect(api).toMatch(/limit\?:\s*number/);
    expect(api).toMatch(/status\?:\s*RegistrationStatusDb\[\]/);
  });
});

describe("UI-09: membership directory — cards + true server pagination (Tier A)", () => {
  test("useMemberships is a plain server-paginated query (no infinite/load-more)", () => {
    const hook = read("src/lib/hooks/use-memberships/index.ts");
    expect(hook).toContain("useQuery");
    expect(hook).not.toContain("useInfiniteQuery");
    expect(hook).not.toContain("loadMore");
    expect(hook).not.toContain("fetchNextPage");
    expect(hook).toContain("fetchMembersPage");
    expect(hook).toContain("totalPages");
  });

  test("hook return contract swaps hasMore/loadMore for page/setPage", () => {
    const types = read("src/lib/hooks/use-memberships/types.ts");
    expect(types).not.toContain("hasMore");
    expect(types).not.toContain("loadMore");
    expect(types).toMatch(/page:\s*number/);
    expect(types).toMatch(/totalPages:\s*number/);
    expect(types).toMatch(/setPage:\s*\(page:\s*number\)\s*=>\s*void/);
  });

  test("MembershipList keeps the card paradigm and uses the pagination primitive", () => {
    const list = read("src/components/memberships/membership-list/list.tsx");
    expect(list).toContain("MemberCard");
    expect(list).toContain('from "@/components/ui/pagination"');
    expect(list).not.toContain("Load More");
    expect(list).not.toContain("onLoadMore");

    const types = read("src/components/memberships/membership-list/types.ts");
    expect(types).not.toContain("onLoadMore");
    expect(types).not.toContain("hasMore");
    expect(types).toMatch(/page:\s*number/);
    expect(types).toMatch(/onPageChange:\s*\(page:\s*number\)\s*=>\s*void/);
  });

  test("directory page wires server pagination, no load-more", () => {
    const page = read("src/app/dashboard/memberships/directory/page.tsx");
    expect(page).not.toContain("loadMore");
    expect(page).not.toContain("hasMore");
    expect(page).toContain("onPageChange");
  });
});

describe("UI-09: awards programs + nominations — DataTable, caps removed (Tier B)", () => {
  test("use-awards drops the limit:100 cap and paginates", () => {
    const hooks = read("src/lib/hooks/use-awards.ts");
    expect(hooks).not.toContain('limit: "100"');
    expect(hooks).toContain('params.set("page"');
    expect(hooks).toContain('params.set("limit"');
    expect(hooks).toContain("totalPages");
  });

  test("programs page renders through the DataTable layer", () => {
    const page = read("src/app/dashboard/awards/programs/page.tsx");
    expect(page).toContain('from "@/components/data-table"');
    expect(page).toContain("DataTable");
    expect(page).toContain("DataTablePagination");
    expect(page).toContain("useDataTableState");
    expect(page).not.toContain('from "@/components/ui/table"');
  });

  test("nominations page renders through the DataTable layer", () => {
    const page = read("src/app/dashboard/awards/nominations/page.tsx");
    expect(page).toContain('from "@/components/data-table"');
    expect(page).toContain("DataTable");
    expect(page).toContain("DataTablePagination");
    expect(page).not.toContain('from "@/components/ui/table"');
  });
});

describe("UI-09: forum reports + moderation queue — paginated DataTable (Tier B)", () => {
  test("reports service paginates (count + limit/offset)", () => {
    const service = read("src/lib/services/forum/reports.ts");
    expect(service).toContain("listReports");
    expect(service).toMatch(/\.limit\(/);
    expect(service).toMatch(/\.offset\(/);
    expect(service).toContain("count()");
    expect(service).toContain("totalPages");
  });

  test("moderation queue service paginates (count + limit/offset)", () => {
    const service = read("src/lib/services/forum/moderation.ts");
    expect(service).toContain("getModerationQueue");
    expect(service).toMatch(/\.limit\(/);
    expect(service).toMatch(/\.offset\(/);
    expect(service).toContain("count()");
    expect(service).toContain("totalPages");
  });

  test("routes parse page/limit and return pagination meta", () => {
    const reportsRoute = read("src/app/api/v1/forums/reports/route.ts");
    expect(reportsRoute).toContain('searchParams.get("page")');
    expect(reportsRoute).toContain('searchParams.get("limit")');
    expect(reportsRoute).toContain("totalPages");

    const queueRoute = read("src/app/api/v1/forums/moderation/queue/route.ts");
    expect(queueRoute).toContain('searchParams.get("page")');
    expect(queueRoute).toContain('searchParams.get("limit")');
    expect(queueRoute).toContain("totalPages");
  });

  test("hooks request pages and expose totals", () => {
    const hooks = read("src/lib/hooks/use-forums.ts");
    expect(hooks).toMatch(/useForumReports\(/);
    expect(hooks).toMatch(/useModerationQueue\(/);
    expect(hooks).toContain("page=");
    expect(hooks).toContain("limit=");
    expect(hooks).toContain("total");
  });

  test("report list + moderation queue render through the DataTable layer", () => {
    const reportList = read("src/app/dashboard/forums/_components/report-list.tsx");
    expect(reportList).toContain('from "@/components/data-table"');
    expect(reportList).toContain("DataTable");
    expect(reportList).toContain("DataTablePagination");
    expect(reportList).not.toContain('from "@/components/ui/table"');

    const queue = read("src/app/dashboard/forums/_components/moderation-queue.tsx");
    expect(queue).toContain('from "@/components/data-table"');
    expect(queue).toContain("DataTable");
    expect(queue).toContain("DataTablePagination");
  });

  test("forum layout tab badges read server totals", () => {
    const layout = read("src/app/dashboard/forums/_components/forum-layout.tsx");
    expect(layout).toContain("moderationQueue?.total");
    expect(layout).toContain("reports?.total");
  });
});

describe("UI-09: login activities — read-only audit DataTable (Tier B)", () => {
  const page = read("src/app/dashboard/login-activities/page.tsx");

  test("renders through the DataTable layer with server pagination", () => {
    expect(page).toContain('from "@/components/data-table"');
    expect(page).toContain("DataTable");
    expect(page).toContain("DataTablePagination");
    expect(page).toContain("keepPreviousData");
    expect(page).toMatch(/page=/);
    expect(page).toMatch(/limit=/);
  });

  test("drops the fake x-user-id header (route uses the session)", () => {
    expect(page).not.toContain("x-user-id");
  });
});

describe("UI-09: active devices — DataTable with working revoke (Tier B)", () => {
  const page = read("src/app/dashboard/active-devices/page.tsx");

  test("renders through the DataTable layer", () => {
    expect(page).toContain('from "@/components/data-table"');
    expect(page).toContain("DataTable");
  });

  test("revokes sessions by token (the API contract) without fake headers", () => {
    expect(page).not.toContain("x-user-id");
    expect(page).toContain("token=");
    expect(page).not.toContain("deviceId=");
    expect(page).toContain("useSession");
  });
});

describe("UI-09: learning admin surfaces — paginated DataTable (Tier C)", () => {
  test("hooks expose paginated table queries", () => {
    const courseHooks = read("src/lib/hooks/use-learning-courses.ts");
    const courseExports = exportedNames(courseHooks);
    expect(courseExports.has("useLearningCoursesPage")).toBe(true);
    expect(courseExports.has("useLearningCourses")).toBe(true);
    expect(courseHooks).toContain("totalPages");

    const certHooks = read("src/lib/hooks/use-learning-certificates.ts");
    const certExports = exportedNames(certHooks);
    expect(certExports.has("useLearningCertificatesPage")).toBe(true);
    expect(certExports.has("useLearningCertificates")).toBe(true);
    expect(certHooks).toContain("totalPages");
  });

  test("admin course management renders through the DataTable layer", () => {
    const page = read("src/app/dashboard/learning/admin/page.tsx");
    expect(page).toContain('from "@/components/data-table"');
    expect(page).toContain("DataTable");
    expect(page).toContain("DataTablePagination");
    expect(page).not.toContain('from "@/components/ui/table"');
  });

  test("certificate management renders through the DataTable layer", () => {
    const page = read("src/app/dashboard/learning/certificate-management/page.tsx");
    expect(page).toContain('from "@/components/data-table"');
    expect(page).toContain("DataTable");
    expect(page).toContain("DataTablePagination");
    expect(page).not.toContain('from "@/components/ui/table"');
  });
});
