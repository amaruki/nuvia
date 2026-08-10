/**
 * Finance tables structural guard (docs/planning/03-frontend-improvement-plan.md,
 * UI-09 Tier A): the five finance tables (invoices, dues, donations, gateways,
 * budget transactions) render through the shared DataTable layer with
 * URL-synced state, honest affordances, and server pagination where an API
 * exists. Source-scanning only — no React is executed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");
const FINANCE_COMPONENTS = join(ROOT, "src", "components", "finance");
const FINANCE_PAGES = join(ROOT, "src", "app", "dashboard", "finance");
const INVOICES_TABLE_DIR = join(FINANCE_COMPONENTS, "invoices-table");
const DUES_TABLE_DIR = join(FINANCE_COMPONENTS, "dues-table");

const TABLE_SOURCES: Record<string, string> = {
  invoices: join(INVOICES_TABLE_DIR, "index.tsx"),
  dues: join(DUES_TABLE_DIR, "dues-table.tsx"),
  donations: join(FINANCE_COMPONENTS, "donations-table.tsx"),
  gateways: join(FINANCE_COMPONENTS, "gateways-table.tsx"),
  budget: join(FINANCE_COMPONENTS, "budget-transaction-table.tsx"),
};

function sourceOf(path: string): string {
  expect(existsSync(path), `expected ${path} to exist`).toBe(true);
  return readFileSync(path, "utf8");
}

describe("finance tables render through the shared DataTable layer", () => {
  for (const [name, path] of Object.entries(TABLE_SOURCES)) {
    test(`${name} table consumes DataTable, not raw shadcn table primitives`, () => {
      const source = sourceOf(path);
      expect(source).toContain('from "@/components/data-table"');
      expect(source).toContain("<DataTable");
      expect(source).toContain("DataTablePagination");
      expect(source).not.toContain('from "@/components/ui/table"');
    });

    test(`${name} table right-aligns money columns with tabular figures`, () => {
      const source = sourceOf(path);
      expect(source).toContain("tabular-nums");
      expect(source).toContain("text-right");
    });
  }

  test("invoices and dues pages sync table state to the URL", () => {
    for (const page of ["invoices", "dues"]) {
      const source = sourceOf(join(FINANCE_PAGES, page, "page.tsx"));
      expect(source).toContain("useDataTableState");
    }
  });
});

describe("finance tables show dates as absolute with a relative tooltip", () => {
  const dated: Record<string, string> = {
    invoices: TABLE_SOURCES.invoices,
    dues: TABLE_SOURCES.dues,
    donations: TABLE_SOURCES.donations,
    budget: TABLE_SOURCES.budget,
    gateways: TABLE_SOURCES.gateways,
  };

  for (const [name, path] of Object.entries(dated)) {
    test(`${name} table pairs absolute dates with relative tooltips`, () => {
      const source = sourceOf(path);
      expect(source).toContain("formatDistanceToNow");
      expect(source).toContain("title=");
    });
  }
});

describe("donations table replaces emoji donor-type glyphs (UI-13)", () => {
  test("no emoji glyphs remain and icons carry accessible labels", () => {
    const source = sourceOf(TABLE_SOURCES.donations);
    for (const glyph of ["👤", "🏢", "🎭", "💵", "🔄", "🤝"]) {
      expect(source).not.toContain(glyph);
    }
    expect(source).toContain("aria-label");
    expect(source).toContain("User");
    expect(source).toContain("Building2");
    expect(source).toContain("EyeOff");
  });
});

describe("no fake download or export affordances remain", () => {
  test("donations table has no handler-less Download Receipt item", () => {
    expect(sourceOf(TABLE_SOURCES.donations)).not.toContain("Download Receipt");
  });

  test("donation details modal has no handler-less Download Receipt button", () => {
    const source = sourceOf(join(FINANCE_COMPONENTS, "donation-details-modal", "actions.tsx"));
    expect(source).not.toContain("Download Receipt");
  });

  test("dues action bar has no handler-less Export button", () => {
    const source = sourceOf(join(FINANCE_PAGES, "dues", "_components", "dues-action-bar.tsx"));
    expect(source).not.toContain("Export");
  });

  test("invoices table exposes no download affordance", () => {
    const source = sourceOf(TABLE_SOURCES.invoices);
    expect(source.toLowerCase()).not.toContain("download");
  });
});

describe("invoices and dues queries paginate server-side instead of capping", () => {
  test("invoice list query passes page and limit to the report endpoint", () => {
    const source = sourceOf(
      join(ROOT, "src", "lib", "hooks", "use-finance-invoices", "use-invoice-queries.ts"),
    );
    expect(source).toMatch(/page=\$\{/);
    expect(source).toMatch(/limit=\$\{/);
  });

  test("dues ledger query passes page and limit to the report endpoint", () => {
    const source = sourceOf(
      join(ROOT, "src", "lib", "hooks", "use-finance-dues", "use-due-queries.ts"),
    );
    expect(source).toMatch(/page=\$\{/);
    expect(source).toMatch(/limit=\$\{/);
  });

  test("the statistics window cap is explicit, not silent", () => {
    for (const hookDir of ["use-finance-invoices", "use-finance-dues"]) {
      const constants = sourceOf(join(ROOT, "src", "lib", "hooks", hookDir, "constants.ts"));
      expect(constants).toContain("STATISTICS_WINDOW_LIMIT");
      expect(constants).not.toContain("PAGE_LIMIT");
    }
  });
});

describe("payment dialogs validate the amount before submitting", () => {
  for (const dir of [INVOICES_TABLE_DIR, DUES_TABLE_DIR]) {
    test(`${dir} payment dialog validates amount against the balance`, () => {
      const dialog = sourceOf(join(dir, "payment-dialog.tsx"));
      expect(dialog).toContain("validatePaymentAmount");
      expect(dialog).toContain('role="alert"');
      const helpers = sourceOf(join(dir, "helpers.ts"));
      expect(helpers).toContain("validatePaymentAmount");
    });
  }
});

describe("superseded raw-table files are removed", () => {
  const removed = [
    join(INVOICES_TABLE_DIR, "invoice-row.tsx"),
    join(INVOICES_TABLE_DIR, "invoice-card.tsx"),
    join(DUES_TABLE_DIR, "due-row.tsx"),
    join(FINANCE_COMPONENTS, "invoices-filters.tsx"),
    join(FINANCE_COMPONENTS, "dues-filters.tsx"),
    join(ROOT, "src", "lib", "hooks", "use-finance-invoices", "invoice-filters.ts"),
    join(ROOT, "src", "lib", "hooks", "use-finance-dues", "due-filters.ts"),
  ];

  for (const path of removed) {
    test(`${path} no longer exists`, () => {
      expect(existsSync(path)).toBe(false);
    });
  }
});
