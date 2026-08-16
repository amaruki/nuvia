/**
 * Secret-scan gate + self-test (issue #5).
 *
 * `bun run scan:secrets` — gitleaks full-history scan of this repository.
 * Fails on any finding not allowed by `.gitleaks.toml`. This is the same
 * gate CI enforces in the `secret-scan` job, and the lefthook pre-push
 * hook runs it locally.
 *
 * `bun run scan:secrets:verify` — proves the gate actually fires, then
 * runs the production gate:
 *   1. Builds a throwaway git repo containing a runtime-generated fake
 *      Stripe secret and asserts gitleaks REJECTS it (exit 1). This guards
 *      against an over-broad allowlist silently disarming the gate.
 *   2. Asserts this repository's full history is CLEAN (exit 0).
 *
 * The fake secret is generated at runtime and never enters this repo's
 * history, so the fixture logic is safe to keep committed.
 *
 * Requires the gitleaks binary (https://github.com/gitleaks/gitleaks
 * releases; CI installs 8.28.0, SHA-256 pinned, in .github/workflows/ci.yml).
 * Set GITLEAKS_BIN to use a non-PATH binary.
 */

import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const gitleaksBin = process.env.GITLEAKS_BIN ?? "gitleaks";
const CONFIG = ".gitleaks.toml";

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function run(args: string[], cwd: string): RunResult {
  const proc = Bun.spawnSync([gitleaksBin, ...args], { cwd });
  return {
    exitCode: proc.exitCode,
    stdout: new TextDecoder().decode(proc.stdout),
    stderr: new TextDecoder().decode(proc.stderr),
  };
}

function git(args: string[], cwd: string): void {
  const proc = Bun.spawnSync(["git", ...args], { cwd });
  if (proc.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${new TextDecoder().decode(proc.stderr)}`);
  }
}

function requireGitleaks(): void {
  const version = run(["version"], ".");
  if (version.exitCode !== 0) {
    console.error(
      [
        "secret-scan: gitleaks binary not found.",
        "Install it from https://github.com/gitleaks/gitleaks/releases",
        "(CI uses v8.28.0) and make sure `gitleaks` is on PATH,",
        "or point GITLEAKS_BIN at the binary.",
      ].join("\n"),
    );
    process.exit(2);
  }
  console.log(`secret-scan: using ${gitleaksBin} ${version.stdout.trim()}`);
}

/** Production gate: this repository's full history must be clean. */
function scanFullHistory(): boolean {
  console.log("secret-scan: scanning full git history…");
  const result = run(["detect", "--config", CONFIG, "--redact"], ".");
  const output = `${result.stdout}${result.stderr}`;
  if (result.exitCode === 0) {
    console.log("secret-scan: OK — no leaks in full git history");
    return true;
  }
  console.error("secret-scan: FAIL — gitleaks found leaks:");
  console.error(output);
  return false;
}

/**
 * Fixture check: a committed secret MUST fail the scan. Uses a runtime-
 * generated fake so no literal secret ever lands in this repo.
 */
function fixtureMustFire(): boolean {
  const dir = mkdtempSync(join(tmpdir(), "gitleaks-fixture-"));
  try {
    const fakeSecret = `sk_live_51${randomBytes(24).toString("hex")}`;
    writeFileSync(join(dir, "config.ts"), `export const STRIPE_SECRET_KEY = "${fakeSecret}";\n`);
    git(["init", "-q"], dir);
    git(["add", "-A"], dir);
    git(
      [
        "-c",
        "user.email=fixture@example.com",
        "-c",
        "user.name=fixture",
        "commit",
        "-qm",
        "fixture",
      ],
      dir,
    );

    const result = run(["detect", "--config", join(process.cwd(), CONFIG), "--redact"], dir);
    if (result.exitCode === 1) {
      console.log("secret-scan: OK — fixture secret correctly rejected the gate");
      return true;
    }
    console.error(
      `secret-scan: FAIL — fixture secret did NOT trip the gate (exit ${result.exitCode}).\n` +
        "The allowlist in .gitleaks.toml is too broad; the scan would miss real secrets.",
    );
    console.error(`${result.stdout}${result.stderr}`);
    return false;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const verifyMode = process.argv.some((arg) => arg === "--verify" || arg.endsWith("verify"));

requireGitleaks();

let ok = true;
if (verifyMode) {
  ok = fixtureMustFire() && ok;
}
ok = scanFullHistory() && ok;

process.exit(ok ? 0 : 1);

// Top-level process.exit paths require module context.
export {};
