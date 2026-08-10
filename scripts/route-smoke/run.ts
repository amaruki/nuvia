/**
 * Route boot smoke (Phase 8, item 7 — docs/planning/03-frontend-improvement-plan.md).
 *
 * Boots the production build (`next start`) on port 3112 and requests the
 * primary public routes plus every nav-manifest dashboard route, asserting
 * the app actually boots and serves: public pages render with real content
 * (200 + a non-trivial body), dashboard pages redirect unauthenticated
 * visitors to login (3xx, which also proves the middleware ran), and
 * nothing answers 500. A 500 here is a boot regression, not a flaky page.
 *
 * Requires a prior `bun run build` (exits 2 without .next so the failure
 * mode is obvious). Run via `bun run test:smoke`.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { navigationData, type NavItemData } from "@/lib/navigation-data";

const ROOT = join(import.meta.dir, "..", "..");
const PORT = 3112;
const BASE = `http://127.0.0.1:${PORT}`;
const BOOT_TIMEOUT_MS = 60_000;
const MIN_PUBLIC_BODY_BYTES = 1024;

/** Primary public routes that must render 200 with real content. */
const PUBLIC_ROUTES = [
  "/",
  "/events",
  "/jobs",
  "/news",
  "/members",
  "/chapters",
  "/committees",
  "/forums",
  "/membership",
  "/donate",
  "/docs",
  "/auth/login",
];

interface ResultRow {
  route: string;
  status: number;
  ok: boolean;
  expectation: string;
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

function collectNavPaths(items: readonly NavItemData[], acc = new Set<string>()): Set<string> {
  for (const item of items) {
    if (item.path) acc.add(item.path);
    if (item.subItems) collectNavPaths(item.subItems, acc);
  }
  return acc;
}

async function waitForBoot(deadline: number): Promise<void> {
  while (Date.now() < deadline) {
    try {
      await fetch(BASE + "/", { redirect: "manual" });
      return; // any answer means the server is up
    } catch {
      await delay(500);
    }
  }
  throw new Error(`next start did not answer on ${BASE} within ${BOOT_TIMEOUT_MS}ms`);
}

async function checkRoute(route: string, expectation: "public" | "dashboard"): Promise<ResultRow> {
  const response = await fetch(BASE + route, { redirect: "manual" });
  const status = response.status;

  if (status >= 500) {
    return { route, status, ok: false, expectation: "no 500s" };
  }

  if (expectation === "public") {
    const body = await response.text();
    const ok = status === 200 && body.length > MIN_PUBLIC_BODY_BYTES;
    return { route, status, ok, expectation: "200 + rendered body" };
  }

  // Unauthenticated dashboard routes must bounce to the login redirect.
  const ok = status >= 300 && status < 400;
  return { route, status, ok, expectation: "3xx login redirect" };
}

async function main(): Promise<number> {
  if (!existsSync(join(ROOT, ".next"))) {
    console.error("route-smoke: no .next build found — run `bun run build` first.");
    return 2;
  }

  const serverLog: string[] = [];
  let child: ChildProcess | null = null;

  try {
    child = spawn(join(ROOT, "node_modules", ".bin", "next"), ["start", "-p", String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    child.stdout?.on("data", (chunk: Buffer) => serverLog.push(chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => serverLog.push(chunk.toString()));

    await waitForBoot(Date.now() + BOOT_TIMEOUT_MS);

    const rows: ResultRow[] = [];

    for (const route of PUBLIC_ROUTES) {
      rows.push(await checkRoute(route, "public"));
    }

    const navRoutes = [...collectNavPaths(navigationData)].sort();
    for (const route of navRoutes) {
      const expectation = route.startsWith("/dashboard") ? "dashboard" : "public";
      rows.push(await checkRoute(route, expectation));
    }

    const failures = rows.filter((row) => !row.ok);
    const width = Math.max(...rows.map((row) => row.route.length));

    console.log("route-smoke results (%d routes):", rows.length);
    for (const row of rows) {
      console.log(
        `  ${row.ok ? "PASS" : "FAIL"}  ${row.status}  ${row.route.padEnd(width)}  (${row.expectation})`,
      );
    }

    if (failures.length > 0) {
      console.error(`route-smoke: ${failures.length} route(s) failed.`);
      console.error("--- next start log tail ---");
      console.error(serverLog.join("").split("\n").slice(-40).join("\n"));
      return 1;
    }

    console.log(`route-smoke: all ${rows.length} routes booted and served correctly.`);
    return 0;
  } catch (error) {
    console.error("route-smoke: boot failure:", error);
    if (serverLog.length > 0) {
      console.error("--- next start log tail ---");
      console.error(serverLog.join("").split("\n").slice(-40).join("\n"));
    }
    return 1;
  } finally {
    if (child && child.exitCode === null) {
      child.kill("SIGTERM");
      await delay(1500);
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  }
}

const exitCode = await main();
process.exit(exitCode);
