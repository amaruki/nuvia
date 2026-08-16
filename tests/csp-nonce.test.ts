/**
 * Security issue #2 — CSP hardening regression.
 *
 * What this pins down:
 *  - `buildCsp` production output: NO 'unsafe-inline' anywhere, script-src
 *    is 'self' + nonce only, img-src is an explicit allowlist (no bare
 *    `https:`), and the pre-issue guards (frame-ancestors/object-src/
 *    base-uri/form-action) survive.
 *  - The nonce round-trip: the value generateCspNonce() produces is exactly
 *    what Next.js's getScriptNonceFromHeader parser accepts — if this ever
 *    stops matching, Next renders every page un-nonced and the policy
 *    blocks its own scripts (the whole feature fails silently).
 *  - The report endpoint: accepts report-uri and report-to shapes, logs,
 *    answers 204, and tolerates junk bodies.
 */

import { describe, expect, test } from "bun:test";

import { buildCsp, generateCspNonce, getCspNonceFromHeader, IMG_SRC_ALLOWLIST } from "@/lib/csp";
import { POST as cspReport } from "@/app/api/v1/csp-report/route";

/**
 * The exact source-expression regex Next.js uses in
 * dist/server/app-render/get-script-nonce-from-header.js — kept literal here
 * on purpose (not imported from node_modules) so a Next upgrade that changes
 * the parser surfaces as a test failure instead of a silent production break.
 */
const NEXT_NONCE_SOURCE_REGEX = /^'nonce-([A-Za-z0-9+/_-]+={0,2})'$/;

function parseDirective(csp: string, directive: string): string[] {
  const found = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(directive));
  if (!found) throw new Error(`directive ${directive} missing from policy: ${csp}`);
  return found.split(/\s+/).slice(1);
}

describe("issue #2 — production CSP policy", () => {
  const nonce = generateCspNonce();
  const csp = buildCsp({ nonce, reportUri: "https://app.example.com/api/v1/csp-report" });

  test("script-src is 'self' + nonce only: no unsafe-inline, no unsafe-eval", () => {
    const sources = parseDirective(csp, "script-src");
    expect(sources).toContain("'self'");
    expect(sources).toContain(`'nonce-${nonce}'`);
    // Scoped to script-src: style-src legitimately keeps 'unsafe-inline'
    // for Radix/shadcn inline style attributes (issue #2 scopes the
    // hardening to scripts + img).
    const scriptDirective = csp
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("script-src"));
    expect(scriptDirective).not.toContain("unsafe-inline");
    expect(scriptDirective).not.toContain("unsafe-eval");
  });

  test("script-src falls back to bare 'self' when the nonce is missing", () => {
    const noNonce = buildCsp({});
    const sources = parseDirective(noNonce, "script-src");
    expect(sources).toEqual(["'self'"]);
    const scriptDirective = noNonce
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("script-src"));
    expect(scriptDirective).not.toContain("unsafe-inline");
  });

  test("img-src is an explicit allowlist — no bare https:", () => {
    const sources = parseDirective(csp, "img-src");
    expect(sources).toContain("'self'");
    expect(sources).toContain("data:");
    expect(sources).toContain("blob:");
    for (const origin of IMG_SRC_ALLOWLIST) {
      expect(sources).toContain(origin);
    }
    expect(sources).not.toContain("https:");
  });

  test("pre-issue guards are preserved", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  test("report-uri is appended only when configured", () => {
    expect(parseDirective(csp, "report-uri")).toEqual([
      "https://app.example.com/api/v1/csp-report",
    ]);
    expect(buildCsp({ nonce })).not.toContain("report-uri");
  });

  test("dev mode keeps the unsafe keywords for Next's dev overlay", () => {
    const devCsp = buildCsp({ dev: true });
    expect(devCsp).toContain("'unsafe-inline'");
    expect(devCsp).toContain("'unsafe-eval'");
    expect(devCsp).toContain("connect-src 'self' ws:");
  });
});

describe("issue #2 — nonce round-trip through Next's parser", () => {
  test("generated nonce matches Next.js's nonce source regex", () => {
    for (let i = 0; i < 200; i += 1) {
      const n = generateCspNonce();
      expect(`'nonce-${n}'`).toMatch(NEXT_NONCE_SOURCE_REGEX);
      // base64 of 16 bytes: 24 chars including padding
      expect(n).toHaveLength(24);
    }
  });

  test("getCspNonceFromHeader mirrors Next's extraction (script-src wins)", () => {
    const nonce = generateCspNonce();
    const policy = buildCsp({ nonce });
    expect(getCspNonceFromHeader(policy)).toBe(nonce);
    // script-src takes precedence over a default-src nonce
    expect(
      getCspNonceFromHeader(`default-src 'nonce-aaa'; script-src 'self' 'nonce-${nonce}'`),
    ).toBe(nonce);
    // falls back to default-src when script-src is absent
    expect(getCspNonceFromHeader("default-src 'self' 'nonce-bbb'")).toBe("bbb");
    // no CSP / no nonce → undefined (layout passes nonce=undefined to
    // ThemeProvider, which Next.js renders without a nonce attribute)
    expect(getCspNonceFromHeader(null)).toBeUndefined();
    expect(getCspNonceFromHeader("default-src 'self'")).toBeUndefined();
    // malformed nonce sources are ignored, like Next does
    expect(getCspNonceFromHeader("script-src 'self' 'nonce-not base64!!'")).toBeUndefined();
  });

  test("two requests get different nonces", () => {
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a).not.toBe(b);
  });
});

describe("issue #2 — /api/v1/csp-report endpoint", () => {
  function reportRequest(body: unknown): Request {
    return new Request("http://localhost:3112/api/v1/csp-report", {
      method: "POST",
      headers: { "content-type": "application/csp-report", "x-forwarded-for": "10.9.2.1" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  test("accepts the report-uri shape and answers 204", async () => {
    const res = await cspReport(
      reportRequest({
        "csp-report": {
          "document-uri": "https://app.example.com/dashboard",
          "blocked-uri": "inline",
          "effective-directive": "script-src-elem",
          "violated-directive": "script-src",
          "original-policy": "script-src 'self' 'nonce-abc'",
          "script-sample": "alert(1)",
          disposition: "enforce",
        },
      }),
    );
    expect(res.status).toBe(204);
  });

  test("accepts the report-to shape (type + body)", async () => {
    const res = await cspReport(
      reportRequest({
        type: "csp-violation",
        body: {
          documentURL: "https://app.example.com/",
          blockedURL: "https://attacker.example/steal",
          effectiveDirective: "img-src",
          disposition: "enforce",
        },
      }),
    );
    expect(res.status).toBe(204);
  });

  test("junk bodies still answer 204 — a report endpoint must never error", async () => {
    expect((await cspReport(reportRequest("not json"))).status).toBe(204);
    expect((await cspReport(reportRequest({}))).status).toBe(204);
    expect((await cspReport(reportRequest({ "csp-report": {} }))).status).toBe(204);
  });
});
