/** Audited-server lifecycle: `next start` (production build) in CI, `next dev` locally.
 *
 * CI mode rationale: the gate used to audit a `next dev` server, which JIT-
 * compiles every page it serves. Two passes over 47 pages saturated the
 * hosted runner (pages degraded from 6s to 3min each until navigation
 * timed out in run 31938000550, and the same exhaustion aborted runs
 * 31930748760/31934735821). `next start` serves prebuilt assets with no
 * compiler workers, at a small cost in fidelity: the gate no longer sees
 * dev-only warnings. That trade is acceptable because the CI job already
 * runs the production build itself and the route-boot smoke covers boot.
 */

import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { existsSync, openSync } from "node:fs";
import { join } from "node:path";

import { BASE_URL, OUTPUT_DIR, PORT, REPO_ROOT } from "./config";
import { commandEnvironment, isServing, log } from "./helpers";

/** CI jobs export CI=true; contributors running the gate locally get dev mode. */
const PRODUCTION_MODE = process.env.CI === "true";

/**
 * Next 16 allows only one `next dev` per project directory. If another dev
 * server already holds that lock, a fresh spawn exits immediately; parse the
 * lock holder's port out of the log and reuse it instead of killing someone
 * else's process.
 */
async function findLockHoldingServer(logPath: string): Promise<string | null> {
  const logText = await Bun.file(logPath).text();
  if (!logText.includes("Another next dev server is already running")) return null;
  const match = logText.match(/Another next dev server[\s\S]*?Local:\s+http:\/\/([^/\s:]+):(\d+)/);
  if (!match) return null;
  // Keep the lock holder's canonical hostname — dev-resource origin checks
  // compare against it, so 127.0.0.1 and localhost are not interchangeable.
  const baseUrl = `http://${match[1]}:${match[2]}`;
  if (!(await isServing(baseUrl))) return null;
  log(`Another next dev holds the project lock; reusing it at ${baseUrl} (left running on exit).`);
  return baseUrl;
}

export async function ensureServer(): Promise<{
  server: ChildProcess | null;
  logFd: number | null;
  baseUrl: string;
}> {
  if (await isServing(BASE_URL)) {
    log(`Reusing server already listening on ${BASE_URL}.`);
    return { server: null, logFd: null, baseUrl: BASE_URL };
  }

  if (PRODUCTION_MODE) {
    // `next start` needs a prior `bun run build`; fail fast with a pointer
    // instead of a cryptic early exit. The CI browser job builds first.
    const buildId = join(REPO_ROOT, ".next", "BUILD_ID");
    if (!existsSync(buildId)) {
      throw new Error("no .next build found — run `bun run build` before the gate in CI mode");
    }
    log(`Spawning next start (production build) on ${BASE_URL}…`);
    const logPath = `${OUTPUT_DIR}/next-start.log`;
    const logFd = openSync(logPath, "w");
    // detached: the child leads its own process group so cleanup can signal
    // the whole tree, not just the wrapper. NODE_ENV must be production —
    // commandEnvironment carries NODE_ENV=test from TEST_ENV, and `next
    // start` refuses to serve a production build outside it.
    const server = spawn(
      "bunx",
      ["next", "start", "--port", String(PORT), "--hostname", "127.0.0.1"],
      {
        cwd: REPO_ROOT,
        env: { ...commandEnvironment, NODE_ENV: "production" } as NodeJS.ProcessEnv,
        stdio: ["ignore", logFd, logFd],
        detached: true,
      },
    );

    const deadline = Date.now() + 90_000; // a production server boots in seconds
    while (Date.now() < deadline) {
      if (server.exitCode !== null) {
        throw new Error(`next start exited early (code ${server.exitCode}); see ${logPath}`);
      }
      if (await isServing(BASE_URL)) {
        log("Production server is answering.");
        return { server, logFd, baseUrl: BASE_URL };
      }
      await Bun.sleep(500);
    }

    await stopServer(server);
    throw new Error(`Production server did not become ready within 90s; see ${logPath}`);
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

  await stopServer(server);
  throw new Error(`Dev server did not become ready within 240s; see ${logPath}`);
}

/** Signal the spawned server's whole process group; SIGKILL if it lingers. */
export async function stopServer(server: ChildProcess): Promise<void> {
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
