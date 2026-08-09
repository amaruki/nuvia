/** Small shared helpers for the a11y smoke gate. */

import { REPO_ROOT, TEST_ENV } from "./config";

export function log(message: string): void {
  console.log(`[a11y-smoke] ${message}`);
}

export const commandEnvironment: Record<string, string> = {
  ...(process.env as Record<string, string>),
  ...TEST_ENV,
};

export async function run(command: readonly string[], env?: Record<string, string>): Promise<void> {
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

export async function isServing(url: string): Promise<boolean> {
  try {
    await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3_000) });
    return true; // any HTTP response means something is listening
  } catch {
    return false;
  }
}
