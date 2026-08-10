/**
 * UI-09 C3 structural guards — users + organization tables
 * (docs/planning/03-frontend-improvement-plan.md, section C3).
 *
 * Covers, structurally (fs read + string asserts; no React execution):
 *  - user directory migrates to the DataTable layer with real server-side
 *    pagination — the silent DIRECTORY_LIMIT = 100 cap is gone;
 *  - aria-sort lives on the <th> only (shared DataTable), never on an inner
 *    sort <Button>;
 *  - keyboard Enter activates a row in the shared DataTable;
 *  - live row-action kebab menus carry aria-labels; dead menu items removed;
 *  - chapters / committees / workspaces / roles tables adopt DataTable +
 *    useDataTableState + DataTablePagination + DataTableSearch;
 *  - every silent single-page limit=100 cap in scope is killed (the
 *    full-dataset hooks drain all pages instead).
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");

const DIRECTORY_PAGE = join(ROOT, "src", "app", "dashboard", "users", "directory", "page.tsx");
const DATA_TABLE_FILE = join(ROOT, "src", "components", "data-table", "data-table.tsx");
const USER_DETAIL_MODAL = join(
  ROOT,
  "src",
  "components",
  "users",
  "user-detail-modal",
  "index.tsx",
);

const ROLES_TABLE = join(
  ROOT,
  "src",
  "components",
  "roles",
  "role-management-table",
  "role-management-table.tsx",
);
const ROLES_HOOK = join(
  ROOT,
  "src",
  "app",
  "dashboard",
  "users",
  "roles",
  "_components",
  "use-roles-data.ts",
);

const CHAPTERS_TAB = join(
  ROOT,
  "src",
  "app",
  "dashboard",
  "organization",
  "chapters",
  "_components",
  "chapters-tab.tsx",
);
const COMMITTEES_TAB = join(
  ROOT,
  "src",
  "app",
  "dashboard",
  "organization",
  "committees",
  "_components",
  "committees-list-tab.tsx",
);
const WORKSPACES_TABS = join(
  ROOT,
  "src",
  "app",
  "dashboard",
  "organization",
  "workspaces",
  "_components",
  "workspaces-tabs.tsx",
);

const CHAPTER_ACTION_MENU = join(
  ROOT,
  "src",
  "components",
  "chapters",
  "chapters-table",
  "chapter-actions-menu.tsx",
);
const COMMITTEE_ACTION_MENU = join(
  ROOT,
  "src",
  "components",
  "committees",
  "committees-table",
  "committee-actions-menu.tsx",
);
const WORKSPACE_ACTION_MENU = join(
  ROOT,
  "src",
  "components",
  "workspaces",
  "workspaces-table",
  "workspace-actions-menu.tsx",
);

const CHAPTERS_HOOK = join(ROOT, "src", "lib", "hooks", "use-chapters", "index.ts");
const CHAPTERS_CONSTANTS = join(ROOT, "src", "lib", "hooks", "use-chapters", "constants.ts");
const COMMITTEES_QUERY_HOOK = join(
  ROOT,
  "src",
  "lib",
  "hooks",
  "use-committees",
  "use-committees-query.ts",
);
const COMMITTEES_CONSTANTS = join(ROOT, "src", "lib", "hooks", "use-committees", "constants.ts");
const WORKSPACES_QUERY_HOOK = join(
  ROOT,
  "src",
  "lib",
  "hooks",
  "use-workspaces",
  "use-filtered-workspaces.ts",
);
const WORKSPACES_CONSTANTS = join(ROOT, "src", "lib", "hooks", "use-workspaces", "constants.ts");
const FETCH_ALL_PAGES = join(ROOT, "src", "lib", "hooks", "fetch-all-pages.ts");

function readIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

/** Every .ts/.tsx file under a directory, recursively. */
function collectSources(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSources(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("UI-09 C3: directory silent cap removed, DataTable layer adopted", () => {
  const page = readFileSync(DIRECTORY_PAGE, "utf8");

  test("DIRECTORY_LIMIT is gone and no limit=100 fetch remains", () => {
    expect(page).not.toMatch(/DIRECTORY_LIMIT/);
    expect(page).not.toMatch(/limit=100/);
    expect(page).not.toMatch(/limit",?\s*"100"/);
  });

  test("wires useDataTableState with faceted filter params", () => {
    expect(page).toMatch(/useDataTableState/);
    expect(page).toMatch(/filterParams/);
    expect(page).toMatch(/role/);
    expect(page).toMatch(/memberStatus/);
  });

  test("uses manual server-side sorting + filtering and pagination/search primitives", () => {
    expect(page).toMatch(/manualSorting/);
    expect(page).toMatch(/manualFiltering/);
    expect(page).toMatch(/DataTablePagination/);
    expect(page).toMatch(/DataTableSearch/);
    expect(page).toMatch(/DataTableFacetedFilter/);
    expect(page).toMatch(/fetchMembersPage/);
  });

  test("selection feeds the bulk role-change bar", () => {
    expect(page).toMatch(/enableSelection/);
    expect(page).toMatch(/onSelectionChange/);
    expect(page).toMatch(/UserActions/);
  });

  test("row click and Enter open the detail modal", () => {
    expect(page).toMatch(/onRowClick/);
    expect(page).toMatch(/UserDetailModal/);
  });

  test("kebab row actions are live, labelled, and offer no unsupported delete", () => {
    expect(page).toMatch(/Actions for/);
    expect(page).toMatch(/aria-label/);
    // No user DELETE endpoint exists — the directory must not offer one.
    expect(page).not.toMatch(/Delete user|Delete User/);
  });

  test("the legacy user-directory / user-table component trees are deleted", () => {
    expect(existsSync(join(ROOT, "src", "components", "users", "user-directory"))).toBe(false);
    expect(existsSync(join(ROOT, "src", "components", "users", "user-table"))).toBe(false);
    expect(page).not.toMatch(/user-directory|user-table/);
  });
});

describe("UI-09 C3: aria-sort lives on the <th>, never on a sort Button", () => {
  test("the old sortable-header with aria-sort on a Button is deleted", () => {
    expect(
      existsSync(join(ROOT, "src", "components", "users", "user-table", "sortable-header.tsx")),
    ).toBe(false);
  });

  test("aria-sort appears only in the shared data-table <th>", () => {
    const roots = [
      join(ROOT, "src", "components", "users"),
      join(ROOT, "src", "components", "chapters"),
      join(ROOT, "src", "components", "committees"),
      join(ROOT, "src", "components", "workspaces"),
      join(ROOT, "src", "components", "roles"),
      join(ROOT, "src", "app", "dashboard", "users"),
      join(ROOT, "src", "app", "dashboard", "organization", "chapters"),
      join(ROOT, "src", "app", "dashboard", "organization", "committees"),
      join(ROOT, "src", "app", "dashboard", "organization", "workspaces"),
    ];
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of collectSources(root)) {
        if (readFileSync(file, "utf8").includes("aria-sort")) {
          offenders.push(file);
        }
      }
    }
    expect(offenders).toEqual([]);
    // And the shared layer keeps it on the TableHead element.
    const dataTable = readFileSync(DATA_TABLE_FILE, "utf8");
    expect(dataTable).toMatch(/TableHead[\s\S]{0,120}aria-sort/);
  });
});

describe("UI-09 C3: keyboard Enter activates a row", () => {
  const dataTable = readFileSync(DATA_TABLE_FILE, "utf8");

  test("clickable rows are focusable", () => {
    expect(dataTable).toMatch(/tabIndex/);
  });

  test("Enter on a focused row triggers onRowClick", () => {
    expect(dataTable).toMatch(/onKeyDown/);
    expect(dataTable).toMatch(/"Enter"|'Enter'/);
    expect(dataTable).toMatch(/onRowClick/);
  });
});

describe("UI-09 C3: user detail modal drops dead tabs", () => {
  const modal = readFileSync(USER_DETAIL_MODAL, "utf8");

  test("dead Actions tab and stub Activity tab are removed", () => {
    expect(modal).not.toMatch(/ActionsTab/);
    expect(modal).not.toMatch(/ActivityTab/);
    expect(modal).toMatch(/OverviewTab/);
    expect(modal).toMatch(/SecurityTab/);
  });

  test("dead tab files are deleted", () => {
    expect(
      existsSync(join(ROOT, "src", "components", "users", "user-detail-modal", "actions-tab.tsx")),
    ).toBe(false);
    expect(
      existsSync(join(ROOT, "src", "components", "users", "user-detail-modal", "activity-tab.tsx")),
    ).toBe(false);
  });
});

describe("UI-09 C3: roles table conforms to the conventions", () => {
  const table = readFileSync(ROLES_TABLE, "utf8");

  test("adopts DataTable with server-side pagination, sorting and search", () => {
    expect(table).toMatch(/DataTable/);
    expect(table).toMatch(/useDataTableState/);
    expect(table).toMatch(/manualSorting/);
    expect(table).toMatch(/manualFiltering/);
    expect(table).toMatch(/DataTablePagination/);
    expect(table).toMatch(/DataTableSearch/);
    expect(table).toMatch(/\/api\/v1\/admin\/users/);
  });

  test("keeps role badges and permission counts", () => {
    expect(table).toMatch(/Badge/);
    expect(table).toMatch(/ROLE_PERMISSIONS/);
  });

  test("no silent limit=100 cap remains in the roles hook", () => {
    const hook = readFileSync(ROLES_HOOK, "utf8");
    expect(hook).not.toMatch(/limit=100/);
  });

  test("dead kebab items removed, live ones labelled", () => {
    expect(table).not.toMatch(/View Permissions/);
    expect(table).not.toMatch(/View History/);
    expect(table).toMatch(/Actions for/);
  });

  test("legacy raw-table files are deleted", () => {
    expect(
      existsSync(
        join(ROOT, "src", "components", "roles", "role-management-table", "users-table.tsx"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(
          ROOT,
          "src",
          "components",
          "roles",
          "role-management-table",
          "role-management-toolbar.tsx",
        ),
      ),
    ).toBe(false);
  });
});

describe("UI-09 C3: chapters / committees / workspaces adopt DataTable", () => {
  const modules: Array<[string, string]> = [
    ["chapters", CHAPTERS_TAB],
    ["committees", COMMITTEES_TAB],
    ["workspaces", WORKSPACES_TABS],
  ];

  for (const [name, file] of modules) {
    test(`${name} list tab is a server-paginated DataTable`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/useDataTableState/);
      expect(source).toMatch(/manualFiltering/);
      expect(source).toMatch(/DataTablePagination/);
      expect(source).toMatch(/DataTableSearch/);
      expect(source).toMatch(/useQuery/);
    });
  }

  test("row-action kebab menus carry aria-labels", () => {
    for (const menu of [CHAPTER_ACTION_MENU, COMMITTEE_ACTION_MENU, WORKSPACE_ACTION_MENU]) {
      const source = readIfExists(menu);
      // Menus may be replaced inline by the DataTable columns; either way an
      // accessible, labelled kebab must exist somewhere in scope.
      if (source) {
        expect(source).toMatch(/aria-label=\{`Actions for/);
      }
    }
    const union =
      (readIfExists(CHAPTERS_TAB) ?? "") +
      (readIfExists(COMMITTEES_TAB) ?? "") +
      (readIfExists(WORKSPACES_TABS) ?? "");
    expect(union).toMatch(/Actions for/);
  });
});

describe("UI-09 C3: silent caps killed in the full-dataset hooks", () => {
  test("a shared fetch-all-pages helper exists", () => {
    const source = readIfExists(FETCH_ALL_PAGES);
    expect(source).not.toBeNull();
    expect(source).toMatch(/export (async )?function fetchAllPages/);
    expect(source).toMatch(/totalPages/);
  });

  test("CHAPTERS_PAGE_LIMIT is gone and the chapters hook drains all pages", () => {
    const constants = readIfExists(CHAPTERS_CONSTANTS);
    expect(constants ?? "").not.toMatch(/CHAPTERS_PAGE_LIMIT/);
    expect(readFileSync(CHAPTERS_HOOK, "utf8")).toMatch(/fetchAllPages/);
  });

  test("COMMITTEES_PAGE_LIMIT is gone and the committees hook drains all pages", () => {
    const constants = readIfExists(COMMITTEES_CONSTANTS);
    expect(constants ?? "").not.toMatch(/COMMITTEES_PAGE_LIMIT/);
    expect(readFileSync(COMMITTEES_QUERY_HOOK, "utf8")).toMatch(/fetchAllPages/);
  });

  test("WORKSPACES_PAGE_LIMIT is gone and the workspaces hook drains all pages", () => {
    const constants = readIfExists(WORKSPACES_CONSTANTS);
    expect(constants ?? "").not.toMatch(/WORKSPACES_PAGE_LIMIT/);
    expect(readFileSync(WORKSPACES_QUERY_HOOK, "utf8")).toMatch(/fetchAllPages/);
  });
});
