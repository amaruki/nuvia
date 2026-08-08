import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { readdirSync, statSync } from "fs";

const API_V1_DIR = join(import.meta.dir, "..", "src", "app", "api", "v1");

function findRouteFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findRouteFiles(full, acc);
    } else if (entry === "route.ts") {
      acc.push(full);
    }
  }
  return acc;
}

const AUTH_CALL_PATTERN =
  /requirePermission|requireRole|auth\.api\.(getSession|signInEmail|signUpEmail|requestPasswordReset|resetPassword|changePassword|deleteUser|updateUser|listSessions|revokeSession|revokeOtherSessions|verifyEmail)/;

// verify-email used to be the one named exception here: a placeholder that
// never called better-auth's verifyEmail endpoint. That is fixed — the
// route now delegates to auth.api.verifyEmail — so the exception list is
// empty. A future placeholder route should not be added to it lightly;
// this list exists to make gaps deliberate and visible, not to hide them.
const KNOWN_EXCEPTIONS = new Set<string>();

describe("every /api/v1/** route calls an authorization/session-check helper", () => {
  const routeFiles = findRouteFiles(API_V1_DIR);

  test("found routes to check (sanity check for the test itself)", () => {
    expect(routeFiles.length).toBeGreaterThan(10);
  });

  for (const file of routeFiles) {
    const relative = file.slice(API_V1_DIR.length + 1);
    const label = KNOWN_EXCEPTIONS.has(relative) ? `${relative} (known exception)` : relative;

    test(label, () => {
      const source = readFileSync(file, "utf-8");
      const hasAuthCall = AUTH_CALL_PATTERN.test(source);

      if (KNOWN_EXCEPTIONS.has(relative)) {
        expect(hasAuthCall).toBe(false); // fails loudly once someone fixes it — update this list then
      } else {
        expect(hasAuthCall).toBe(true);
      }
    });
  }
});
