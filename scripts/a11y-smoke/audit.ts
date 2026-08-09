/** Better-auth sign-in plus the per-page axe audit and violation summaries. */

import AxeBuilder from "@axe-core/playwright";
import type { AxeResults, Result } from "axe-core";
import type { BrowserContext } from "playwright";

import { ADMIN_EMAIL, PAGES, SEVERITIES_FAILING, WCAG_TAGS } from "./config";
import { log } from "./helpers";

type PlaywrightCookie = Parameters<BrowserContext["addCookies"]>[0][number];

/**
 * Signs in through the better-auth HTTP API with plain fetch and copies the
 * Set-Cookie values into the browser context. (Playwright's own request
 * context trips parsing the relative response URL under Bun when storing
 * cookies, so we stay out of its HTTP stack.)
 */
export async function signIn(
  context: BrowserContext,
  password: string,
  baseUrl: string,
): Promise<void> {
  log(`Signing in as ${ADMIN_EMAIL} via /api/auth/sign-in/email…`);
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password }),
  });

  if (!response.ok) {
    throw new Error(`Sign-in failed with HTTP ${response.status}: ${await response.text()}`);
  }

  const headers = response.headers;
  let header: string[];
  if (typeof headers.getSetCookie === "function") {
    header = headers.getSetCookie();
  } else if ("getAll" in headers && typeof headers.getAll === "function") {
    header = headers.getAll("set-cookie");
  } else {
    const single = headers.get("set-cookie");
    header = single ? [single] : [];
  }
  if (header.length === 0) {
    throw new Error("Sign-in response did not include any Set-Cookie headers.");
  }

  const cookies: PlaywrightCookie[] = header.map((raw) => {
    const [nameValue, ...attributes] = raw.split(";").map((part) => part.trim());
    const separator = nameValue.indexOf("=");
    const cookie: PlaywrightCookie = {
      name: nameValue.slice(0, separator),
      value: nameValue.slice(separator + 1),
      domain: "127.0.0.1",
      path: "/",
    };
    for (const attribute of attributes) {
      const [keyRaw, ...valueParts] = attribute.split("=");
      const key = keyRaw.toLowerCase();
      const value = valueParts.join("=");
      if (key === "path" && value) cookie.path = value;
      else if (key === "max-age") cookie.expires = Math.floor(Date.now() / 1000) + Number(value);
      else if (key === "expires") cookie.expires = Math.floor(Date.parse(value) / 1000);
      else if (key === "httponly") cookie.httpOnly = true;
      else if (key === "secure") cookie.secure = true;
      else if (key === "samesite") {
        const normalized = value.toLowerCase();
        if (normalized === "strict") cookie.sameSite = "Strict";
        else if (normalized === "none") cookie.sameSite = "None";
        else cookie.sameSite = "Lax";
      }
    }
    return cookie;
  });

  await context.addCookies(cookies);
  const stored = await context.cookies();
  if (!stored.some((cookie) => cookie.name.includes("session_token"))) {
    throw new Error("Sign-in succeeded but no session cookie was stored.");
  }
  log("Signed in; session cookie present.");
}

export interface PageReport {
  slug: string;
  module: string;
  path: string;
  url: string;
  violations: Result[];
  failing: Result[];
  reportOnly: Result[];
}

export async function auditPage(
  context: BrowserContext,
  target: (typeof PAGES)[number],
  baseUrl: string,
): Promise<PageReport> {
  const url = `${baseUrl}${target.path}`;
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 180_000 });
    // Dashboard pages hydrate + fetch data client-side; give them a moment,
    // but never fail the audit if the network just stays chatty.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

    const results: AxeResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    const failing = results.violations.filter(
      (violation) => violation.impact != null && violation.impact in SEVERITIES_FAILING,
    );
    const reportOnly = results.violations.filter(
      (violation) => violation.impact == null || !(violation.impact in SEVERITIES_FAILING),
    );

    return {
      slug: target.slug,
      module: target.module,
      path: target.path,
      url,
      violations: results.violations,
      failing,
      reportOnly,
    };
  } finally {
    await page.close();
  }
}

export function summarizeViolation(violation: Result): string {
  const nodes = violation.nodes.map((node) => node.target.join(" ")).join("; ");
  return `    [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s)) — ${nodes}`;
}
