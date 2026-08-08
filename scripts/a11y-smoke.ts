/**
 * WCAG 2.2 AA axe smoke gate for the enabled modules (backlog item E1,
 * docs/adr/0008-module-maturity-gate.md).
 *
 * Run with: bun run test:a11y
 *
 * What it does, self-contained and idempotent:
 *   1. Boots the test Postgres/Redis stack (compose.test.yml) if not up,
 *      pushes the schema (drizzle-kit push --force) and seeds the admin
 *      accounts with a fresh per-run password (SEED_ADMIN_PASSWORD).
 *   2. Spawns `next dev` on a dedicated port (default 3111, override with
 *      A11Y_SMOKE_PORT) unless something already answers there — a server it
 *      spawned is killed on exit; a pre-existing one is left alone.
 *   3. Signs in as the seeded superadmin via the better-auth email endpoint
 *      (session cookie lands in the Playwright context automatically).
 *   4. Runs @axe-core/playwright against ONE representative authenticated
 *      page per enabled module (finance — promoted in backlog C5 — is
 *      covered on all six of its dashboard pages) plus the public /events
 *      and /jobs pages.
 *      critical/serious violations fail the run; moderate/minor are
 *      report-only. Raw axe results are written to a unique /tmp directory.
 *
 * No test runner, no new dependencies (playwright + @axe-core/playwright are
 * already devDependencies for this gate).
 */

import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, openSync } from "node:fs";
import { chromium } from "playwright";
import type { Browser, BrowserContext } from "playwright";
import type { AxeResults, Result } from "axe-core";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = Number(process.env.A11Y_SMOKE_PORT ?? "3111");
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = "admin@nuvia.com";

const REPO_ROOT = import.meta.dir + "/..";
const OUTPUT_DIR = `/tmp/nuvia-a11y-smoke-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;

/** Test infrastructure endpoints — mirrors scripts/run-integration-tests.ts. */
const TEST_ENV = {
  APP_URL: BASE_URL,
  BETTER_AUTH_SECRET: "local-test-secret-not-for-production-use-000000",
  DATABASE_URL: "postgresql://nuvia:nuvia@127.0.0.1:15433/nuvia",
  NODE_ENV: "test",
  REDIS_URL: "redis://127.0.0.1:16380",
  RATE_LIMIT_MAX_REQUESTS: "1000",
  RATE_LIMIT_WINDOW_MINUTES: "15",
} as const;

const COMPOSE_COMMAND = [
  "docker",
  "compose",
  "--file",
  "compose.test.yml",
  "--project-name",
  "nuvia-test",
] as const;

/** WCAG tags covering 2.0/2.1/2.2 levels A + AA. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * One representative page per enabled module (config/features.ts module
 * flags) plus the two public listings. Finance — promoted in backlog C5 —
 * is audited on all six of its dashboard pages. See
 * docs/accessibility/wcag-2.2-aa-enabled-modules.md for the selection.
 */
const PAGES = [
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
] as const;

const SEVERITIES_FAILING: Record<string, true> = { critical: true, serious: true };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[a11y-smoke] ${message}`);
}

const commandEnvironment: Record<string, string> = {
  ...(process.env as Record<string, string>),
  ...TEST_ENV,
};

async function run(command: readonly string[], env?: Record<string, string>): Promise<void> {
  const child = Bun.spawn([...command], {
    cwd: REPO_ROOT,
    env: { ...commandEnvironment, ...env },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}: ${command.join(" ")}`);
  }
}

async function isServing(url: string): Promise<boolean> {
  try {
    await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3_000) });
    return true; // any HTTP response means something is listening
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Infrastructure: compose stack, schema, seed
// ---------------------------------------------------------------------------

async function ensureTestStack(): Promise<void> {
  log("Ensuring test Postgres/Redis stack is up (compose.test.yml)…");
  await run([...COMPOSE_COMMAND, "up", "--detach", "--wait"]);
  log("Pushing database schema (drizzle-kit push --force)…");
  await run(["bunx", "drizzle-kit", "push", "--force"]);
}

async function seedAdmin(password: string): Promise<void> {
  log(`Seeding admin accounts (${ADMIN_EMAIL} and role peers)…`);
  await run(["bun", "run", "scripts/seed.ts"], { SEED_ADMIN_PASSWORD: password });
}

/**
 * Rate limiting is Redis-backed and keyed by IP + route (ADR-0003), so
 * repeated smoke runs accumulate hits in the shared test Redis and
 * eventually trip the 100-requests/15-minutes API backstop mid-audit.
 * Flush the test database first so every run starts from clean buckets.
 */
async function flushRateLimitState(): Promise<void> {
  log("Flushing test Redis so stale rate-limit buckets cannot taint the audit…");
  const { Redis } = await import("ioredis");
  const redis = new Redis(TEST_ENV.REDIS_URL, { maxRetriesPerRequest: 3 });
  try {
    await redis.flushdb();
  } finally {
    redis.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Dev server lifecycle
// ---------------------------------------------------------------------------

/**
 * Next 16 allows only one `next dev` per project directory. If another dev
 * server already holds that lock, a fresh spawn exits immediately; parse the
 * lock holder's port out of the log and reuse it instead of killing someone
 * else's process.
 */
async function findLockHoldingServer(logPath: string): Promise<string | null> {
  const logText = await Bun.file(logPath).text();
  if (!logText.includes("Another next dev server is already running")) return null;
  const match = logText.match(/Another next dev server[\s\S]*?Local:\s+http:\/\/[^/\s:]+:(\d+)/);
  if (!match) return null;
  const baseUrl = `http://127.0.0.1:${match[1]}`;
  if (!(await isServing(baseUrl))) return null;
  log(`Another next dev holds the project lock; reusing it at ${baseUrl} (left running on exit).`);
  return baseUrl;
}

async function ensureDevServer(): Promise<{
  server: ChildProcess | null;
  logFd: number | null;
  baseUrl: string;
}> {
  if (await isServing(BASE_URL)) {
    log(`Reusing server already listening on ${BASE_URL}.`);
    return { server: null, logFd: null, baseUrl: BASE_URL };
  }

  log(`Spawning next dev on ${BASE_URL}…`);
  const logPath = `${OUTPUT_DIR}/next-dev.log`;
  const logFd = openSync(logPath, "w");
  // detached: the child leads its own process group so cleanup can signal
  // the whole tree (bunx → next → bundler workers), not just the wrapper.
  const server = spawn("bunx", ["next", "dev", "--port", String(PORT), "--hostname", "127.0.0.1"], {
    cwd: REPO_ROOT,
    env: commandEnvironment as NodeJS.ProcessEnv,
    stdio: ["ignore", logFd, logFd],
    detached: true,
  });

  const deadline = Date.now() + 240_000; // first compile can be slow
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      // The child may exit before its lock message is flushed to the log;
      // give the file a few seconds to settle before declaring failure.
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const lockHeld = await findLockHoldingServer(logPath);
        if (lockHeld) return { server: null, logFd, baseUrl: lockHeld };
        await Bun.sleep(500);
      }
      throw new Error(`next dev exited early (code ${server.exitCode}); see ${logPath}`);
    }
    if (await isServing(BASE_URL)) {
      log("Dev server is answering.");
      return { server, logFd, baseUrl: BASE_URL };
    }
    await Bun.sleep(1_000);
  }

  await stopDevServer(server);
  throw new Error(`Dev server did not become ready within 240s; see ${logPath}`);
}

/** Signal the spawned server's whole process group; SIGKILL if it lingers. */
async function stopDevServer(server: ChildProcess): Promise<void> {
  if (server.pid === undefined) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    return; // process group already gone
  }
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!(await isServing(BASE_URL))) return;
    await Bun.sleep(500);
  }
  try {
    process.kill(-server.pid, "SIGKILL");
  } catch {
    // process group already gone
  }
}

// ---------------------------------------------------------------------------
// Auth + axe run
// ---------------------------------------------------------------------------

type PlaywrightCookie = Parameters<BrowserContext["addCookies"]>[0][number];

/**
 * Signs in through the better-auth HTTP API with plain fetch and copies the
 * Set-Cookie values into the browser context. (Playwright's own request
 * context trips parsing the relative response URL under Bun when storing
 * cookies, so we stay out of its HTTP stack.)
 */
async function signIn(context: BrowserContext, password: string, baseUrl: string): Promise<void> {
  log(`Signing in as ${ADMIN_EMAIL} via /api/auth/sign-in/email…`);
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password }),
  });

  if (!response.ok) {
    throw new Error(`Sign-in failed with HTTP ${response.status}: ${await response.text()}`);
  }

  const headers = response.headers;
  let header: string[];
  if (typeof headers.getSetCookie === "function") {
    header = headers.getSetCookie();
  } else if ("getAll" in headers && typeof headers.getAll === "function") {
    header = headers.getAll("set-cookie");
  } else {
    const single = headers.get("set-cookie");
    header = single ? [single] : [];
  }
  if (header.length === 0) {
    throw new Error("Sign-in response did not include any Set-Cookie headers.");
  }

  const cookies: PlaywrightCookie[] = header.map((raw) => {
    const [nameValue, ...attributes] = raw.split(";").map((part) => part.trim());
    const separator = nameValue.indexOf("=");
    const cookie: PlaywrightCookie = {
      name: nameValue.slice(0, separator),
      value: nameValue.slice(separator + 1),
      domain: "127.0.0.1",
      path: "/",
    };
    for (const attribute of attributes) {
      const [keyRaw, ...valueParts] = attribute.split("=");
      const key = keyRaw.toLowerCase();
      const value = valueParts.join("=");
      if (key === "path" && value) cookie.path = value;
      else if (key === "max-age") cookie.expires = Math.floor(Date.now() / 1000) + Number(value);
      else if (key === "expires") cookie.expires = Math.floor(Date.parse(value) / 1000);
      else if (key === "httponly") cookie.httpOnly = true;
      else if (key === "secure") cookie.secure = true;
      else if (key === "samesite") {
        const normalized = value.toLowerCase();
        if (normalized === "strict") cookie.sameSite = "Strict";
        else if (normalized === "none") cookie.sameSite = "None";
        else cookie.sameSite = "Lax";
      }
    }
    return cookie;
  });

  await context.addCookies(cookies);
  const stored = await context.cookies();
  if (!stored.some((cookie) => cookie.name.includes("session_token"))) {
    throw new Error("Sign-in succeeded but no session cookie was stored.");
  }
  log("Signed in; session cookie present.");
}

interface PageReport {
  slug: string;
  module: string;
  path: string;
  url: string;
  violations: Result[];
  failing: Result[];
  reportOnly: Result[];
}

async function auditPage(
  context: BrowserContext,
  target: (typeof PAGES)[number],
  baseUrl: string,
): Promise<PageReport> {
  const url = `${baseUrl}${target.path}`;
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 180_000 });
    // Dashboard pages hydrate + fetch data client-side; give them a moment,
    // but never fail the audit if the network just stays chatty.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

    const results: AxeResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    const failing = results.violations.filter(
      (violation) => violation.impact != null && violation.impact in SEVERITIES_FAILING,
    );
    const reportOnly = results.violations.filter(
      (violation) => violation.impact == null || !(violation.impact in SEVERITIES_FAILING),
    );

    return {
      slug: target.slug,
      module: target.module,
      path: target.path,
      url,
      violations: results.violations,
      failing,
      reportOnly,
    };
  } finally {
    await page.close();
  }
}

function summarizeViolation(violation: Result): string {
  const nodes = violation.nodes.map((node) => node.target.join(" ")).join("; ");
  return `    [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s)) — ${nodes}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await Bun.write(`${OUTPUT_DIR}/.keep`, "");
  log(`Output directory: ${OUTPUT_DIR}`);

  // Per-run password: strong enough for validatePasswordStrength, never reused.
  const password = `A11ySmoke!${randomBytes(12).toString("base64url")}`;
  await ensureTestStack();
  await flushRateLimitState();
  await seedAdmin(password);

  const { server, logFd, baseUrl } = await ensureDevServer();
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ baseURL: baseUrl });
    await signIn(context, password, baseUrl);

    const reports: PageReport[] = [];
    for (const target of PAGES) {
      log(`Auditing ${target.path} …`);
      const report = await auditPage(context, target, baseUrl);
      reports.push(report);
      await Bun.write(
        `${OUTPUT_DIR}/axe-${target.slug}.json`,
        JSON.stringify(report.violations, null, 2),
      );
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    let failingTotal = 0;
    let reportOnlyTotal = 0;

    console.log("\n[a11y-smoke] === axe results (WCAG 2.2 AA tags) ===");
    for (const report of reports) {
      failingTotal += report.failing.length;
      reportOnlyTotal += report.reportOnly.length;
      const status = report.failing.length === 0 ? "PASS" : "FAIL";
      console.log(
        `[a11y-smoke] ${status} ${report.path} — ${report.failing.length} critical/serious, ${report.reportOnly.length} moderate/minor`,
      );
      for (const violation of report.failing) console.log(summarizeViolation(violation));
      for (const violation of report.reportOnly) console.log(summarizeViolation(violation));
    }

    await Bun.write(
      `${OUTPUT_DIR}/summary.json`,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl,
          pages: reports.map((report) => ({
            slug: report.slug,
            module: report.module,
            path: report.path,
            failing: report.failing.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              nodes: violation.nodes.length,
            })),
            reportOnly: report.reportOnly.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              nodes: violation.nodes.length,
            })),
          })),
        },
        null,
        2,
      ),
    );

    console.log(
      `\n[a11y-smoke] Total: ${failingTotal} critical/serious (fail gate), ${reportOnlyTotal} moderate/minor (report-only). Raw results: ${OUTPUT_DIR}`,
    );

    if (failingTotal > 0) {
      throw new Error(
        `WCAG 2.2 AA gate failed: ${failingTotal} critical/serious axe violation(s).`,
      );
    }
    log("WCAG 2.2 AA gate passed.");
  } finally {
    if (browser) await browser.close();
    if (server) {
      log("Stopping dev server…");
      await stopDevServer(server);
    }
    if (logFd !== null) closeSync(logFd);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[a11y-smoke]", error instanceof Error ? error.message : error);
    process.exit(1);
  });
