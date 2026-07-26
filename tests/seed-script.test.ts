import { describe, expect, test } from "bun:test";

// scripts/seed.ts calls process.exit() at module load time if
// SEED_ADMIN_PASSWORD is missing/weak — that would kill the test runner
// itself if imported directly, so this runs it as a real subprocess
// instead and only exercises the failure paths (running the success path
// would seed 5 real privileged accounts into the test database as a side
// effect, which isn't what this test is checking).
async function runSeed(env: Record<string, string | undefined>) {
  const proc = Bun.spawn(["bun", "run", "scripts/seed.ts"], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stderr, exitCode] = await Promise.all([new Response(proc.stderr).text(), proc.exited]);

  return { exitCode, stderr };
}

describe("scripts/seed.ts", () => {
  test("exits non-zero when SEED_ADMIN_PASSWORD is not set", async () => {
    const { exitCode, stderr } = await runSeed({ SEED_ADMIN_PASSWORD: undefined });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("SEED_ADMIN_PASSWORD is not set");
  });

  test("exits non-zero when SEED_ADMIN_PASSWORD is too weak", async () => {
    const { exitCode, stderr } = await runSeed({ SEED_ADMIN_PASSWORD: "weak" });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("does not meet password requirements");
  });
});
