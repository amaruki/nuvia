/**
 * Content module table tests — structural guard for the DataTable migration.
 *
 * Scope: the five content admin tables (articles, announcements, publications,
 * categories, media) must run on the shared DataTable layer with server-side
 * pagination/search/sort, confirmed bulk actions, and honest state handling.
 *
 * These tests assert the wiring (imports, props, params) via file contents —
 * matching the style of tests/data-table-layer.test.ts — and stay runnable
 * without a DOM.
 */

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function readSrc(relPath: string): string {
  const p = join(ROOT, relPath);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf8");
}

interface ContentModule {
  slug: "articles" | "announcements" | "publications" | "categories" | "media";
  page: string;
  tab: string;
  columns: string;
}

const MODULES: ContentModule[] = [
  {
    slug: "articles",
    page: "src/app/dashboard/content/articles/page.tsx",
    tab: "src/app/dashboard/content/articles/_components/articles-tab.tsx",
    columns: "src/components/content/content-data-table/articles-columns.tsx",
  },
  {
    slug: "announcements",
    page: "src/app/dashboard/content/announcements/page.tsx",
    tab: "src/app/dashboard/content/announcements/_components/announcements-tab.tsx",
    columns: "src/components/content/content-data-table/announcements-columns.tsx",
  },
  {
    slug: "publications",
    page: "src/app/dashboard/content/publications/page.tsx",
    tab: "src/app/dashboard/content/publications/_components/publications-tab.tsx",
    columns: "src/components/content/content-data-table/publications-columns.tsx",
  },
  {
    slug: "categories",
    page: "src/app/dashboard/content/categories/page.tsx",
    tab: "src/app/dashboard/content/categories/_components/categories-list-tab.tsx",
    columns: "src/components/content/content-data-table/categories-columns.tsx",
  },
  {
    slug: "media",
    page: "src/app/dashboard/content/media/page.tsx",
    tab: "src/app/dashboard/content/media/_components/library-tab.tsx",
    columns: "src/components/content/content-data-table/media-columns.tsx",
  },
];

const SHARED_DIR = "src/components/content/content-data-table";

describe("content tables run on the shared DataTable layer", () => {
  for (const mod of MODULES) {
    test(`${mod.slug}: tab file exists and renders the DataTable`, () => {
      expect(readSrc(mod.tab)).not.toBe("");
      expect(readSrc(mod.columns)).not.toBe("");
    });

    test(`${mod.slug}: tab uses useDataTableState + DataTable + DataTablePagination`, () => {
      const src = readSrc(mod.tab);
      expect(src).toContain("useDataTableState");
      expect(src).toContain("<DataTable");
      expect(src).toContain("<DataTablePagination");
    });

    test(`${mod.slug}: page renders the table tab`, () => {
      const page = readSrc(mod.page);
      const name =
        mod.slug === "categories"
          ? "CategoriesListTab"
          : mod.slug === "media"
            ? "LibraryTab"
            : `${cap(mod.slug)}Tab`;
      expect(page).toContain(name);
    });

    test(`${mod.slug}: sortable column headers via DataTableColumnHeader`, () => {
      const src = readSrc(mod.columns);
      expect(src).toContain("DataTableColumnHeader");
    });

    test(`${mod.slug}: density toggle wired into the table toolbar`, () => {
      const src = readSrc(mod.tab);
      expect(src).toContain("density=");
      expect(src).toContain("ContentTableToolbar");
      const toolbar = readSrc(`${SHARED_DIR}/content-table-toolbar.tsx`);
      expect(toolbar).toContain("DataTableDensityToggle");
      expect(toolbar).toContain("DataTableSearch");
    });

    test(`${mod.slug}: server-driven search via globalFilter`, () => {
      const src = readSrc(mod.tab);
      expect(src).toContain("setGlobalFilter");
    });

    test(`${mod.slug}: no silent client-side caps`, () => {
      const src = readSrc(mod.tab);
      expect(src).not.toContain("limit=100");
      expect(src).not.toContain(".slice(0, 10)");
    });
  }
});

describe("content tables: sorting and filtering modes", () => {
  test("server-sorted collections pass manualSorting", () => {
    for (const slug of ["articles", "announcements", "publications"]) {
      const mod = MODULES.find((m) => m.slug === slug)!;
      const src = readSrc(mod.tab);
      expect(src).toContain("manualSorting");
      expect(src).toContain("manualFiltering");
      expect(src).toContain("onSortingChange=");
    }
  });

  test("client-sorted collections (categories/media) keep manualFiltering for search", () => {
    for (const slug of ["categories", "media"]) {
      const mod = MODULES.find((m) => m.slug === slug)!;
      const src = readSrc(mod.tab);
      expect(src).toContain("manualFiltering");
    }
  });

  test("articles columns sort title and publishedAt server-side", () => {
    const src = readSrc("src/components/content/content-data-table/articles-columns.tsx");
    expect(src).toContain('id: "title"');
    expect(src).toContain('id: "publishedAt"');
    expect(src).toContain("enableSorting: true");
  });
});

describe("content tables: bulk actions are confirmed, not instant", () => {
  for (const mod of MODULES) {
    test(`${mod.slug}: bulk bar + AlertDialog confirmation`, () => {
      const src = readSrc(mod.tab);
      expect(src).toContain("ContentBulkBar");
      const bulkBar = readSrc(`${SHARED_DIR}/content-bulk-bar.tsx`);
      expect(bulkBar).toContain("DataTableBulkBar");
      expect(bulkBar).toContain("AlertDialog");
    });
  }
});

describe("content tables: column quality bar", () => {
  test("author cell renders avatar + name from the wire shape", () => {
    const cells = readSrc(`${SHARED_DIR}/cells.tsx`);
    expect(cells).toContain("Avatar");
    expect(cells).toContain("avatarUrl");
  });

  test("date cell shows absolute date with relative time as title", () => {
    const cells = readSrc(`${SHARED_DIR}/cells.tsx`);
    expect(cells).toContain("formatDistanceToNow");
    expect(cells).toContain("title=");
  });

  test("long text truncates with a title fallback", () => {
    const cells = readSrc(`${SHARED_DIR}/cells.tsx`);
    expect(cells).toContain("truncate");
  });

  test("status column renders badges", () => {
    for (const slug of ["articles", "announcements", "publications", "categories", "media"]) {
      const mod = MODULES.find((m) => m.slug === slug)!;
      const src = readSrc(mod.columns);
      expect(src).toContain("Badge");
    }
  });
});

describe("content tables: server pagination is wired end-to-end", () => {
  test("shared query hook builds page/limit/search params and reads meta", () => {
    const hook = readSrc(`${SHARED_DIR}/use-content-table-query.ts`);
    expect(hook).toContain("/api/v1/content/");
    expect(hook).toContain('set("page"');
    expect(hook).toContain('set("limit"');
    expect(hook).toContain('set("search"');
    expect(hook).toContain("totalPages");
  });

  test("content list endpoint keeps page/limit/search contract", () => {
    const src = readSrc("src/app/api/v1/content/shared.ts");
    expect(src).toContain("contentListQuerySchema");
    expect(src).toContain("totalPages");
  });

  test("media list endpoint gains page/limit/search", () => {
    const route = readSrc("src/app/api/v1/media/route.ts");
    expect(route).toContain("page");
    expect(route).toContain("limit");
    expect(route).toContain("search");
    const service = readSrc("src/lib/services/media-upload.service.ts");
    expect(service).toContain("page");
    expect(service).toContain("limit");
    expect(service).toContain("search");
  });
});

describe("content tables: selection state is controlled", () => {
  for (const mod of MODULES) {
    test(`${mod.slug}: table owns row selection + onSelectionChange`, () => {
      const src = readSrc(mod.tab);
      expect(src).toContain("onSelectionChange");
      expect(src).toContain("rowSelection");
    });
  }
});

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
