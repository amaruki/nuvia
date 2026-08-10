/**
 * UI-09 core-layer structural guard (docs/planning/03-frontend-improvement-plan.md,
 * section A + convention 5): the shadcn pagination primitive exists in
 * src/components/ui/, the public member directory consumes it (link-based,
 * no-JS paging), and the shared data-table barrel exposes the density
 * mechanism without dropping any existing export.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");
const UI_DIR = join(ROOT, "src", "components", "ui");
const DATA_TABLE_DIR = join(ROOT, "src", "components", "data-table");
const PAGINATION_FILE = join(UI_DIR, "pagination.tsx");
const BARREL_FILE = join(DATA_TABLE_DIR, "index.ts");
const DATA_TABLE_FILE = join(DATA_TABLE_DIR, "data-table.tsx");
const MEMBER_PAGINATION_FILE = join(
  ROOT,
  "src",
  "app",
  "(public)",
  "members",
  "_components",
  "member-pagination.tsx",
);

/**
 * Exported identifiers of a module, parsed structurally (no import, so the
 * test never executes React). Covers `export function|const|type|interface`,
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
    for (const part of match[1].split(",")) {
      const trimmed = part.trim().replace(/^type\s+/, "");
      if (!trimmed) {
        continue;
      }
      const renamed = trimmed.match(/\bas\s+([A-Za-z_$][\w$]*)/);
      names.add(renamed ? renamed[1] : trimmed);
    }
  }
  return names;
}

describe("UI-09: shadcn pagination primitive (plan line 328)", () => {
  test("src/components/ui/pagination.tsx exists", () => {
    expect(existsSync(PAGINATION_FILE)).toBe(true);
  });

  test("exports the full shadcn pagination set", () => {
    const names = exportedNames(readFileSync(PAGINATION_FILE, "utf8"));
    for (const expected of [
      "Pagination",
      "PaginationContent",
      "PaginationItem",
      "PaginationLink",
      "PaginationPrevious",
      "PaginationNext",
      "PaginationEllipsis",
    ]) {
      expect(names.has(expected)).toBe(true);
    }
  });

  test("is link-based and styled with the button tokens", () => {
    const source = readFileSync(PAGINATION_FILE, "utf8");
    // Paging must work without JavaScript: PaginationLink renders a plain
    // anchor (or an asChild element such as next/link), never a button-only
    // interaction.
    expect(source).toMatch(/buttonVariants/);
    expect(source).toMatch(/ChevronLeft/);
    expect(source).toMatch(/ChevronRight/);
    expect(source).toMatch(/href/);
    expect(source).not.toMatch(/useState|useEffect|onClick=\{/);
  });
});

describe("UI-09: member directory paging consumes the primitive", () => {
  const source = readFileSync(MEMBER_PAGINATION_FILE, "utf8");

  test("imports from @/components/ui/pagination", () => {
    expect(source).toContain("@/components/ui/pagination");
  });

  test("keeps the directory nav aria-label", () => {
    expect(source).toContain('aria-label="Member directory pagination"');
  });

  test("keeps the ?page=N&query=... URL scheme", () => {
    expect(source).toMatch(/\/members\?/);
    expect(source).toMatch(/params\.set\("page"/);
  });
});

describe("UI-09: data-table barrel density mechanism (convention 5)", () => {
  const barrel = readFileSync(BARREL_FILE, "utf8");
  const barrelNames = exportedNames(barrel);

  test("exports DataTableDensityToggle and the DataTableDensity type", () => {
    expect(barrelNames.has("DataTableDensityToggle")).toBe(true);
    expect(barrelNames.has("DataTableDensity")).toBe(true);
  });

  test("DataTable accepts a comfortable|compact density prop", () => {
    const source = readFileSync(DATA_TABLE_FILE, "utf8");
    expect(source).toMatch(/density\?:\s*DataTableDensity/);
    expect(source).toMatch(/"comfortable"/);
    expect(source).toMatch(/"compact"/);
  });

  test("the toggle persists under the nuvia:table-density key, SSR-safely", () => {
    const toggleFile = join(DATA_TABLE_DIR, "data-table-density.tsx");
    expect(existsSync(toggleFile)).toBe(true);
    const source = readFileSync(toggleFile, "utf8");
    expect(source).toContain("nuvia:table-density");
    expect(source).toContain("useEffect");
    expect(source).toContain("localStorage");
  });
});

describe("UI-09: barrel keeps every pre-existing export", () => {
  const barrelNames = exportedNames(readFileSync(BARREL_FILE, "utf8"));

  for (const expected of [
    "DataTable",
    "DataTableColumnHeader",
    "DataTablePagination",
    "DataTableSearch",
    "DataTableViewOptions",
    "DataTableFacetedFilter",
    "DataTableBulkBar",
    "useDataTableState",
  ]) {
    test(`still exports ${expected}`, () => {
      expect(barrelNames.has(expected)).toBe(true);
    });
  }
});
