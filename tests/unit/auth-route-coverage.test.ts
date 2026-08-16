import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { readdirSync, statSync } from "fs";

const API_V1_DIR = join(import.meta.dir, "..", "..", "src", "app", "api", "v1");

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

// Hardening (Phase 8, item 8): AUTH_CALL_PATTERN used to match mentions
// inside comments and docblocks, so a route that only DOCUMENTED an auth
// call passed this scan. Strip comments before matching. The scanner is
// string-aware so comment-looking sequences inside literals survive; it is
// not a full parser, which is enough for generated route files.
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let mode: "code" | "line" | "block" | "single" | "double" | "template" = "code";
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line";
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block";
        i += 2;
        continue;
      }
      if (ch === "'") mode = "single";
      else if (ch === '"') mode = "double";
      else if (ch === "`") mode = "template";
      out += ch;
      i += 1;
      continue;
    }
    if (mode === "line") {
      if (ch === "\n") {
        mode = "code";
        out += ch;
      }
      i += 1;
      continue;
    }
    if (mode === "block") {
      if (ch === "*" && next === "/") {
        mode = "code";
        // A block comment is a token separator in JS; keep the tokens apart
        // so stripping can never fuse identifiers into a false match.
        out += " ";
        i += 2;
        continue;
      }
      if (ch === "\n") out += ch; // keep line numbers stable
      i += 1;
      continue;
    }
    out += ch;
    if (ch === "\\") {
      out += next ?? "";
      i += 2;
      continue;
    }
    if (
      (mode === "single" && ch === "'") ||
      (mode === "double" && ch === '"') ||
      (mode === "template" && ch === "`")
    ) {
      mode = "code";
    }
    i += 1;
  }
  return out;
}

// Thin delegators: the route file itself carries no auth call because the
// handler lives in a shared module that enforces it. Each mapped module is
// checked against the same AUTH_CALL_PATTERN, so a regression in the shared
// module fails loudly here. Keep this list as small as the delegation.
const DELEGATED_AUTH: Record<string, string> = {
  "content/announcements/route.ts": "content/shared.ts",
  "content/announcements/[id]/route.ts": "content/shared.ts",
  "content/articles/route.ts": "content/shared.ts",
  "content/articles/[id]/route.ts": "content/shared.ts",
  "content/categories/route.ts": "content/shared.ts",
  "content/categories/[id]/route.ts": "content/shared.ts",
  "content/publications/route.ts": "content/shared.ts",
  "content/publications/[id]/route.ts": "content/shared.ts",
};

// Named exceptions, exposed by stripComments (Phase 8, item 8): both routes'
// only match under AUTH_CALL_PATTERN was a comment mention. Each
// authenticates by design through a mechanism outside the pattern's
// vocabulary, so it is recorded here deliberately and visibly instead of
// being papered over:
//
//   - webhooks/stripe: a provider callback carries no user session; the
//     caller is authenticated by Stripe-Signature verification against
//     STRIPE_WEBHOOK_SECRET (ADR-0015 section 4, docs/api-specs/webhooks.md,
//     and docs/api-specs/_index.md's single documented exception to the
//     requirePermission rule).
//   - demo/login: UI-39's disposable-account login; role-gated to the demo
//     account, limited by RATE_LIMITS.demoLogin, and authenticated by
//     forwarding credentials to better-auth's own sign-in handler
//     (auth.api.signInEmail is avoided on purpose: it mints no cookies).
//   - health: a deployment probe for orchestrators (Docker HEALTHCHECK,
//     load balancers) that have no credentials. Listed in proxy.ts's
//     public endpoints for the same reason. Returns dependency
//     reachability booleans only — no versions, configuration, or error
//     details (health.service.ts's honesty contract), so exposing it
//     anonymously leaks nothing actionable.
//   - csp-report: the browser fires CSP violation reports unauthenticated
//     from the violating page (issue #2's report-uri). Listed in proxy.ts's
//     public endpoints; IP-rate-limited (RATE_LIMITS.cspReport) and the
//     handler clips every field before logging, so it is a bounded
//     write-only log sink that leaks nothing.
//
// Each entry asserts hasAuthCall === false below, so the moment one of these
// routes gains a real session/permission call the test fails loudly and the
// entry must come out. Do not add placeholder routes here lightly.
const KNOWN_EXCEPTIONS: Record<string, true> = {
  "webhooks/stripe/route.ts": true,
  "demo/login/route.ts": true,
  "health/route.ts": true,
  "csp-report/route.ts": true,
};

describe("every /api/v1/** route calls an authorization/session-check helper", () => {
  const routeFiles = findRouteFiles(API_V1_DIR);

  test("found routes to check (sanity check for the test itself)", () => {
    expect(routeFiles.length).toBeGreaterThan(10);
  });

  for (const file of routeFiles) {
    const relative = file.slice(API_V1_DIR.length + 1);
    const delegatedTo = DELEGATED_AUTH[relative];
    const label =
      relative in KNOWN_EXCEPTIONS
        ? `${relative} (known exception)`
        : delegatedTo
          ? `${relative} (delegates to ${delegatedTo})`
          : relative;

    test(label, () => {
      const source = readFileSync(delegatedTo ? join(API_V1_DIR, delegatedTo) : file, "utf-8");
      const hasAuthCall = AUTH_CALL_PATTERN.test(stripComments(source));

      if (relative in KNOWN_EXCEPTIONS) {
        expect(hasAuthCall).toBe(false); // fails loudly once someone fixes it — update this list then
      } else {
        expect(hasAuthCall).toBe(true);
      }
    });
  }
});
