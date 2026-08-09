/** `next dev` lifecycle: reuse a running server, spawn, wait for readiness, tear down. */

import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { openSync } from "node:fs";

import { BASE_URL, OUTPUT_DIR, PORT, REPO_ROOT } from "./config";
import { commandEnvironment, isServing, log } from "./helpers";

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

export async function ensureDevServer(): Promise<{
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
export async function stopDevServer(server: ChildProcess): Promise<void> {
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
