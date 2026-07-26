import { describe, expect, test } from "bun:test";

// env.ts throws at module import time by design (a misconfigured deploy
// must fail to boot, not fail on the first request) — that means it can't
// be re-exercised with different fake env vars via a normal import in this
// same test process, since ESM module state is cached after the first
// (already-valid, from .env) load. Spawn a fresh subprocess per case
// instead, same approach as scripts/seed.ts's tests.
async function loadEnvWith(env: Record<string, string>) {
  const proc = Bun.spawn(["bun", "-e", "await import('./src/lib/env.ts')"], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      APP_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://nuvia:nuvia@localhost:15433/nuvia",
      ...env,
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stderr, exitCode] = await Promise.all([new Response(proc.stderr).text(), proc.exited]);

  return { exitCode, stderr };
}

describe("env.ts", () => {
  test("throws on a placeholder BETTER_AUTH_SECRET in production", async () => {
    const { exitCode, stderr } = await loadEnvWith({
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "your-secret-key-here",
      REDIS_URL: "redis://localhost:16380",
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Invalid environment configuration");
    expect(stderr).toContain("BETTER_AUTH_SECRET");
  });

  test("throws when REDIS_URL is unset in production", async () => {
    const { exitCode, stderr } = await loadEnvWith({
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "a".repeat(32),
      // Explicit empty string, not just omitted — Bun auto-loads .env from
      // cwd for the spawned subprocess too, which would otherwise supply
      // the real REDIS_URL this repo's local .env sets for other tests.
      REDIS_URL: "",
    });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("REDIS_URL is required in production");
  });

  test("loads successfully with a valid production config", async () => {
    const { exitCode, stderr } = await loadEnvWith({
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "a".repeat(32),
      REDIS_URL: "redis://localhost:16380",
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
  });

  test("does not require REDIS_URL outside production", async () => {
    const { exitCode } = await loadEnvWith({
      NODE_ENV: "development",
      BETTER_AUTH_SECRET: "a".repeat(32),
    });

    expect(exitCode).toBe(0);
  });
});
