/**
 * Finance tables structural guard (docs/plans/2026-07-23-finance-tables-plan.md,
 * D6): the five finance dashboard tables run on the shared DataTable layer,
 * invoices/dues paginate server-side, aggregate windows state their caps,
 * affordances stay honest, and payment amounts validate before submit.
 *
 * These tests assert the wiring (imports, props, params) via file contents —
 * matching the style of tests/unit/tables-content.test.ts and
 * tests/unit/data-table-layer.test.ts — and stay runnable without a DOM.
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

const INVOICES_TABLE = "src/components/finance/invoices-table/index.tsx";
const DUES_TABLE = "src/components/finance/dues-table/dues-table.tsx";
const DONATIONS_TABLE = "src/components/finance/donations-table.tsx";
const GATEWAYS_TABLE = "src/components/finance/gateways-table.tsx";
const BUDGET_TABLE = "src/components/finance/budget-transaction-table.tsx";

const FIVE_TABLES = [
  { name: "invoices-table", path: INVOICES_TABLE },
  { name: "dues-table", path: DUES_TABLE },
  { name: "donations-table", path: DONATIONS_TABLE },
  { name: "gateways-table", path: GATEWAYS_TABLE },
  { name: "budget-transaction-table", path: BUDGET_TABLE },
];

const INVOICES_PAGE = "src/app/dashboard/finance/invoices/page.tsx";
const DUES_PAGE = "src/app/dashboard/finance/dues/page.tsx";

const INVOICE_QUERIES = "src/lib/hooks/use-finance-invoices/use-invoice-queries.ts";
const DUE_QUERIES = "src/lib/hooks/use-finance-dues/use-due-queries.ts";
const INVOICE_CONSTANTS = "src/lib/hooks/use-finance-invoices/constants.ts";
const DUE_CONSTANTS = "src/lib/hooks/use-finance-dues/constants.ts";

const INVOICES_HELPERS = "src/components/finance/invoices-table/helpers.ts";
const DUES_HELPERS = "src/components/finance/dues-table/helpers.ts";
const INVOICES_PAYMENT_DIALOG = "src/components/finance/invoices-table/payment-dialog.tsx";
const DUES_PAYMENT_DIALOG = "src/components/finance/dues-table/payment-dialog.tsx";

const INVOICE_ACTIONS_MENU = "src/components/finance/invoices-table/invoice-actions-menu.tsx";
const DUE_ACTIONS_MENU = "src/components/finance/dues-table/due-actions-menu.tsx";

describe("five finance tables run on the shared DataTable layer", () => {
  for (const table of FIVE_TABLES) {
    test(`${table.name}: imports DataTable from @/components/data-table and renders it`, () => {
      const src = readSrc(table.path);
      expect(src).not.toBe("");
      expect(src).toContain('from "@/components/data-table"');
      expect(src).toContain("<DataTable");
      expect(src).toContain("DataTablePagination");
    });

    test(`${table.name}: no raw @/components/ui/table import remains`, () => {
      expect(readSrc(table.path)).not.toContain("@/components/ui/table");
    });
  }
});

describe("invoices + dues pages own the URL-synced table state", () => {
  test("invoices page uses useDataTableState", () => {
    expect(readSrc(INVOICES_PAGE)).toContain("useDataTableState");
  });

  test("dues page uses useDataTableState", () => {
    expect(readSrc(DUES_PAGE)).toContain("useDataTableState");
  });
});

describe("money cells are right-aligned tabular-nums in all five tables", () => {
  for (const table of FIVE_TABLES) {
    test(`${table.name}: tabular-nums + text-right`, () => {
      const src = readSrc(table.path);
      expect(src).toContain("tabular-nums");
      expect(src).toContain("text-right");
    });
  }
});

describe("date cells carry title tooltips (absolute date + relative text)", () => {
  for (const table of FIVE_TABLES) {
    test(`${table.name}: title attribute alongside formatDistanceToNow`, () => {
      const src = readSrc(table.path);
      expect(src).toContain("title=");
      expect(src).toContain("formatDistanceToNow");
    });
  }
});

describe("donations table: emoji-free lucide icons with accessible labels (UI-13)", () => {
  const BANNED_EMOJI = ["👤", "🏢", "🎭", "💵", "🔄", "🤝"];
  // Plan D3 names Incognito for the anonymous donor; lucide-react 1.27.0 has
  // no Incognito export, so VenetianMask stands in for it.
  const TYPE_ICONS = ["User", "Building2", "VenetianMask", "Banknote", "Repeat", "Handshake"];

  test("donor-type and donation-type emoji glyphs are gone", () => {
    const src = readSrc(DONATIONS_TABLE);
    for (const glyph of BANNED_EMOJI) {
      expect(src).not.toContain(glyph);
    }
  });

  test("donor and donation types map to lucide icons (User/Building2/VenetianMask, Banknote/Repeat/Handshake)", () => {
    const src = readSrc(DONATIONS_TABLE);
    for (const icon of TYPE_ICONS) {
      expect(src).toMatch(new RegExp(`\\b${icon}\\b`));
    }
  });

  test("type icons carry aria-labels", () => {
    const src = readSrc(DONATIONS_TABLE);
    expect(src).toContain("DONOR_TYPE_ICONS");
    expect(src).toContain("DONATION_TYPE_ICONS");
    expect(src).toContain("aria-label=");
  });
});

describe("honest affordances in the five tables", () => {
  test('no handler-less "Download Receipt" item remains', () => {
    for (const table of FIVE_TABLES) {
      expect(readSrc(table.path)).not.toContain("Download Receipt");
    }
  });

  test("no fake Export buttons", () => {
    for (const table of FIVE_TABLES) {
      expect(readSrc(table.path)).not.toContain("Export");
    }
  });

  test("donation details modal actions expose no Download Receipt", () => {
    expect(readSrc("src/components/finance/donation-details-modal/actions.tsx")).not.toContain(
      "Download Receipt",
    );
  });

  test("dues action bar exposes no Export affordance", () => {
    expect(readSrc("src/app/dashboard/finance/dues/_components/dues-action-bar.tsx")).not.toContain(
      "Export",
    );
  });

  test("invoices table exposes no download affordance at all", () => {
    expect(readSrc(INVOICES_TABLE).toLowerCase()).not.toContain("download");
  });
});

describe("invoice + due hooks interpolate page=/limit= (no silent caps)", () => {
  const QUERY_HOOKS = [
    { name: "use-invoice-queries", path: INVOICE_QUERIES },
    { name: "use-due-queries", path: DUE_QUERIES },
  ];

  for (const hook of QUERY_HOOKS) {
    test(`${hook.name}: table query interpolates page and limit`, () => {
      expect(readSrc(hook.path)).toMatch(/\?page=\$\{page\}&limit=\$\{pageSize\}/);
    });

    test(`${hook.name}: window + payments queries pin page=1 to the stated limits`, () => {
      const src = readSrc(hook.path);
      expect(src).toMatch(/page=1&limit=\$\{STATISTICS_WINDOW_LIMIT\}/);
      expect(src).toMatch(/page=1&limit=\$\{PAYMENTS_RECENT_LIMIT\}/);
    });
  }
});

describe("window caps are documented constants with stating comments", () => {
  const CONSTANTS = [
    { name: "invoices", path: INVOICE_CONSTANTS },
    { name: "dues", path: DUE_CONSTANTS },
  ];

  for (const entry of CONSTANTS) {
    test(`${entry.name}: STATISTICS_WINDOW_LIMIT and PAYMENTS_RECENT_LIMIT exist`, () => {
      const src = readSrc(entry.path);
      expect(src).toContain("STATISTICS_WINDOW_LIMIT = 100");
      expect(src).toContain("PAYMENTS_RECENT_LIMIT = 100");
    });

    test(`${entry.name}: the superseded PAGE_LIMIT constant is gone`, () => {
      expect(readSrc(entry.path)).not.toContain("PAGE_LIMIT");
    });

    test(`${entry.name}: aggregate-window comment states the cap`, () => {
      expect(readSrc(entry.path)).toContain("The table itself paginates");
    });
  }
});

describe("payment amount validation (plan D4)", () => {
  test("validatePaymentAmount exists in both table helper modules", () => {
    for (const helpers of [INVOICES_HELPERS, DUES_HELPERS]) {
      expect(readSrc(helpers)).toContain("function validatePaymentAmount(");
    }
  });

  test("helpers reject <= 0, more than two decimals, and overpaying the balance", () => {
    for (const helpers of [INVOICES_HELPERS, DUES_HELPERS]) {
      const src = readSrc(helpers);
      expect(src).toContain("greater than zero");
      expect(src).toContain("decimal places");
      expect(src).toContain("outstanding balance");
    }
  });

  test('payment dialogs call the validator and render role="alert" errors', () => {
    for (const dialog of [INVOICES_PAYMENT_DIALOG, DUES_PAYMENT_DIALOG]) {
      const src = readSrc(dialog);
      expect(src).toContain("validatePaymentAmount");
      expect(src).toContain('role="alert"');
      expect(src).toContain("disabled=");
    }
  });
});

describe("dead files from the pre-DataTable layout are deleted (plan D7)", () => {
  const DEAD_FILES = [
    "src/components/finance/invoices-table/invoice-row.tsx",
    "src/components/finance/invoices-table/invoice-card.tsx",
    "src/components/finance/dues-table/due-row.tsx",
    "src/components/finance/invoices-filters.tsx",
    "src/components/finance/dues-filters.tsx",
    "src/lib/hooks/use-finance-invoices/invoice-filters.ts",
    "src/lib/hooks/use-finance-dues/due-filters.ts",
  ];

  for (const relPath of DEAD_FILES) {
    test(`${relPath} is gone`, () => {
      expect(existsSync(join(ROOT, relPath))).toBe(false);
    });
  }
});

describe("kebab triggers have accessible names (UI-08)", () => {
  test("invoice-actions-menu trigger carries an aria-label", () => {
    expect(readSrc(INVOICE_ACTIONS_MENU)).toContain("aria-label=");
  });

  test("due-actions-menu trigger carries an aria-label", () => {
    expect(readSrc(DUE_ACTIONS_MENU)).toContain("aria-label=");
  });
});
