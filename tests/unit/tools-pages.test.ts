/**
 * UI-23 guard: the four tools pages (cache, database, logs, backup) are
 * honest, superadmin-only ops surfaces — real probes and queries instead of
 * the bare-h1 stubs they replaced, gated in the demo sandbox (D3/D13).
 *
 * Source-scan tests (like tests/server-first.test.ts): they assert on the
 * text of the files themselves, so the gates and the honesty contract can't
 * regress even if the pages never render in CI. Every assertion maps to a
 * requirement:
 *
 *  - pages and components exist
 *  - server components stay hook/handler/form-free (no client interactivity)
 *  - the superadmin gate is present in every page source
 *  - demo-sandbox gating reuses UI-39's mechanism (isRoleAllowedForPath +
 *    the isDemoMode flag the DemoBanner reads)
 *  - no destructive handlers anywhere in the tools surfaces
 *  - no fabricated statuses: every value traces to a real probe, query, or
 *    a documented literal fact
 */
import { describe, expect, test } from "bun:test";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");
const TOOLS_DIR = join(ROOT, "src", "app", "dashboard", "tools");
const SERVICES_DIR = join(ROOT, "src", "lib", "services");

const TOOL_NAMES = ["cache", "database", "logs", "backup"] as const;
type ToolName = (typeof TOOL_NAMES)[number];

/** Shared read helper — every assertion below must see the exact file bytes. */
async function readSource(path: string): Promise<string> {
  const file = Bun.file(path);
  expect({ path, exists: await file.exists() }).toEqual({ path, exists: true });
  return file.text();
}

const pagePath = (tool: ToolName) => join(TOOLS_DIR, tool, "page.tsx");
const componentPath = (tool: ToolName, name: string) =>
  join(TOOLS_DIR, tool, "_components", `${name}.tsx`);
const servicePath = (tool: ToolName) => join(SERVICES_DIR, `system-${tool}.service.ts`);

const PANEL_NAME: Record<ToolName, string> = {
  cache: "cache-status-panel",
  database: "database-health-panel",
  logs: "logs-status-panel",
  backup: "backup-status-panel",
};

const SERVICE_FUNCTION: Record<ToolName, string> = {
  cache: "getCacheSystemStatus",
  database: "getDatabaseHealth",
  logs: "getLogsSystemStatus",
  backup: "getBackupSystemStatus",
};

const toolSources = async (tool: ToolName): Promise<string> =>
  [
    await readSource(pagePath(tool)),
    await readSource(componentPath(tool, "tools-access-denied-card")),
    await readSource(componentPath(tool, "demo-sandbox-notice")),
    await readSource(componentPath(tool, PANEL_NAME[tool])),
    await readSource(servicePath(tool)),
  ].join("\n");

// ── existence ─────────────────────────────────────────────────────────────

describe("UI-23: tools pages and components exist", () => {
  for (const tool of TOOL_NAMES) {
    test(`${tool}: page and its three components exist`, async () => {
      await readSource(pagePath(tool));
      await readSource(componentPath(tool, "tools-access-denied-card"));
      await readSource(componentPath(tool, "demo-sandbox-notice"));
      await readSource(componentPath(tool, PANEL_NAME[tool]));
    });

    test(`${tool}: its system-${tool} service exists`, async () => {
      await readSource(servicePath(tool));
    });
  }
});

// ── server-component purity ───────────────────────────────────────────────

describe("UI-23: tools surfaces are hook-free server components", () => {
  for (const tool of TOOL_NAMES) {
    test(`${tool}: no client directive, hooks, handlers, or forms`, async () => {
      const sources = await toolSources(tool);

      expect(sources).not.toContain('"use client"');
      expect(sources).not.toContain("'use client'");
      expect(sources).not.toMatch(/use[A-Z][a-zA-Z]*\(/);
      expect(sources).not.toMatch(/on[A-Z][a-zA-Z]*=/);
      // No client interactivity seam at all: no forms, no server actions.
      expect(sources).not.toContain("<form");
      expect(sources).not.toContain('"use server"');
      expect(sources).not.toContain("formAction=");
    });
  }
});

// ── superadmin gate ───────────────────────────────────────────────────────

describe("UI-23: every tools page carries the superadmin gate", () => {
  for (const tool of TOOL_NAMES) {
    test(`${tool}: unauthenticated redirect + superadmin-only check`, async () => {
      const page = await readSource(pagePath(tool));

      expect(page).toContain("getCurrentUser()");
      expect(page).toContain('redirect("/auth/login")');
      // The nav-data roles gate (UI-39 mechanism) rejects the demo role and
      // any other role outside the section's list.
      expect(page).toContain("isRoleAllowedForPath(PATH, user.role)");
      // The superadmin-only restriction on top of it.
      expect(page).toContain('user.role !== "superadmin"');
      // Denial renders the permission-denied card, not a silent redirect.
      expect(page).toContain("<ToolsAccessDeniedCard");
    });

    test(`${tool}: the denial card names the superadmin role`, async () => {
      const card = await readSource(componentPath(tool, "tools-access-denied-card"));
      expect(card).toContain("Superadmin access required");
      expect(card).toContain("superadmin role");
    });
  }
});

// ── demo-sandbox gating (D3/D13) ──────────────────────────────────────────

describe("UI-23: demo-sandbox gating reuses the UI-39 mechanism", () => {
  for (const tool of TOOL_NAMES) {
    test(`${tool}: page renders the demo-sandbox notice`, async () => {
      const page = await readSource(pagePath(tool));
      expect(page).toContain("<DemoSandboxNotice");
    });

    test(`${tool}: the notice reads isDemoMode lazily and hides when off`, async () => {
      const notice = await readSource(componentPath(tool, "demo-sandbox-notice"));
      // Same mechanism as the global DemoBanner: the lazy isDemoMode() flag.
      expect(notice).toContain('import { isDemoMode } from "@/lib/env"');
      expect(notice).toContain("if (!isDemoMode()) return null;");
      expect(notice).toContain("DEMO_MODE=true");
    });
  }
});

// ── no destructive handlers ───────────────────────────────────────────────

/**
 * Actionable destructive patterns. Deliberately scoped to calls/statements
 * (parens, SQL verbs) so honest PROSE about the absence of these actions —
 * e.g. "the only FLUSHDB belongs to the a11y test harness" — keeps passing.
 */
const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /flushdb\(/i,
  /flushall\(/i,
  /\.delete\(/,
  /\.update\(/,
  /\.insert\(/,
  /\bdrop table\b/i,
  /\btruncate table\b/i,
  /\bdelete from\b/i,
  /\.exec\(/,
  /child_process/,
];

describe("UI-23: tools surfaces expose no destructive handlers", () => {
  for (const tool of TOOL_NAMES) {
    test(`${tool}: nothing mutates state`, async () => {
      const sources = await toolSources(tool);
      for (const pattern of DESTRUCTIVE_PATTERNS) {
        expect(sources).not.toMatch(pattern);
      }
    });
  }
});

// ── no fabricated statuses ────────────────────────────────────────────────

describe("UI-23: statuses trace to real probes, queries, or stated facts", () => {
  test("cache service probes Redis with a real PING and reads real config", async () => {
    const service = await readSource(servicePath("cache"));
    expect(service).toContain(".ping()");
    expect(service).toContain("ENABLE_REDIS_CACHE");
    expect(service).toContain("getCacheStatus");
    expect(service).toContain("CACHE_PREFIX");
    expect(service).toContain('import { Redis } from "ioredis"');
  });

  test("cache page documents why there is no flush button", async () => {
    const panel = await readSource(componentPath("cache", PANEL_NAME.cache));
    expect(panel.toLowerCase()).toContain("flush");
    expect(panel).toContain("a11y test harness");
  });

  test("database service runs real SELECTs only", async () => {
    const service = await readSource(servicePath("database"));
    expect(service).toContain("select version()");
    expect(service).toContain("count(*)");
    expect(service).toContain("__drizzle_migrations");
    expect(service).toContain("_journal.json");
    expect(service).toContain("getTableConfig");
    // Every query goes through the read path — no mutation API on `db`.
    expect(service).not.toMatch(/db\.(insert|update|delete)\(/);
  });

  test("database page states the read-only contract", async () => {
    const panel = await readSource(componentPath("database", PANEL_NAME.database));
    expect(panel).toContain("SELECT");
    expect(panel.toLowerCase()).toContain("no destructive");
  });

  test("logs service reports the stdout truth, not an invented viewer", async () => {
    const service = await readSource(servicePath("logs"));
    expect(service).toContain('sink: "stdout"');
    expect(service).toContain("LOGGING_LEVEL");
    expect(service).toContain("authLog");
    expect(service).toContain('"bun run dev"');
    expect(service).toContain('"bun run start"');
  });

  test("logs page points at the run command and never fakes history", async () => {
    const panel = await readSource(componentPath("logs", PANEL_NAME.logs));
    expect(panel.toLowerCase()).toContain("stdout");
    expect(panel.toLowerCase()).toContain("no file sink");
    expect(panel).toContain("auth_logs");
  });

  test("backup service states the operator-managed truth", async () => {
    const service = await readSource(servicePath("backup"));
    // Literal fact about the repository, never a probe that could lie.
    expect(service).toContain("configured: false");
    // The example command derives from compose.yml values and is labeled.
    expect(service).toContain("pg_dump");
    expect(service).toContain("Examples only");
    // The scripts/ listing is live data, not hardcoded.
    expect(service).toContain("readdir");
  });

  test("backup page shows no backup action", async () => {
    const page = await readSource(pagePath("backup"));
    const panel = await readSource(componentPath("backup", PANEL_NAME.backup));
    expect(page).toContain("Operator-managed");
    expect(panel).toContain("Not configured");
    expect(panel).toContain("Examples only");
  });
});

// ── wiring ────────────────────────────────────────────────────────────────

describe("UI-23: pages are wired to their services and stay dynamic", () => {
  for (const tool of TOOL_NAMES) {
    test(`${tool}: page awaits its ${SERVICE_FUNCTION[tool]} service`, async () => {
      const page = await readSource(pagePath(tool));
      expect(page).toContain(`@/lib/services/system-${tool}.service`);
      expect(page).toContain(`await ${SERVICE_FUNCTION[tool]}()`);
      expect(page).toContain('export const dynamic = "force-dynamic"');
    });
  }
});
