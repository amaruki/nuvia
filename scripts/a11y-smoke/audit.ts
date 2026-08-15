/** Better-auth sign-in plus the per-page axe audit and violation summaries. */

import AxeBuilder from "@axe-core/playwright";
import type { AxeResults, Result } from "axe-core";
import type { BrowserContext, Page, Response as PlaywrightResponse } from "playwright";

import { ADMIN_EMAIL, SEVERITIES_FAILING, WCAG_TAGS } from "./config";
import type { PageTarget, ThemeName } from "./config";
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

  const cookieDomain = new URL(baseUrl).hostname;
  const cookies: PlaywrightCookie[] = header.map((raw) => {
    const [nameValue, ...attributes] = raw.split(";").map((part) => part.trim());
    const separator = nameValue.indexOf("=");
    const cookie: PlaywrightCookie = {
      name: nameValue.slice(0, separator),
      value: nameValue.slice(separator + 1),
      // The cookie must live on the same host the context browses (BASE_URL).
      // Hardcoding a different hostname here silently strands the session:
      // every dashboard page then 302s to /auth/login and axe would audit
      // the login page while reporting PASS for the dashboard target.
      domain: cookieDomain,
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
  theme: ThemeName;
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
  target: PageTarget,
  baseUrl: string,
  theme: ThemeName,
): Promise<PageReport> {
  const url = `${baseUrl}${target.path}`;
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 180_000 });
    // Dashboard pages hydrate + fetch data client-side; give them a moment,
    // but never fail the audit if the network just stays chatty.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

    await assertThemeApplied(page, theme, url);
    if (target.expectText !== undefined) {
      await assertExpectedContent(page, response, target.expectText, url);
    }

    const results: AxeResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    const failing = results.violations.filter(
      (violation) => violation.impact != null && violation.impact in SEVERITIES_FAILING,
    );
    const reportOnly = results.violations.filter(
      (violation) => violation.impact == null || !(violation.impact in SEVERITIES_FAILING),
    );

    return {
      theme,
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

/**
 * UI-10: every pass must prove its theme is actually active before axe runs —
 * an unapplied theme would silently audit the wrong palette. next-themes'
 * blocking inline script sets documentElement[data-theme] before first paint,
 * so by "load" the attribute already reflects the pass's seeded localStorage
 * key.
 */
async function assertThemeApplied(page: Page, theme: ThemeName, url: string): Promise<void> {
  const applied = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  if (applied !== theme) {
    throw new Error(
      `${theme} pass cannot be trusted on ${url}: expected <html data-theme="${theme}"> but found ` +
        (applied === null ? "no data-theme attribute" : `data-theme="${applied}"`) +
        " — aborting rather than auditing the wrong palette.",
    );
  }
}

/**
 * UI-10: detail and empty-list pages must be proven to have returned HTTP
 * 200 and rendered the intended view (real seeded content / the empty
 * state) — axe would happily pass a not-found fallback and hide a dead URL.
 */
async function assertExpectedContent(
  page: Page,
  response: PlaywrightResponse | null,
  expectText: string,
  url: string,
): Promise<void> {
  if (response === null || response.status() !== 200) {
    throw new Error(
      `${url} did not return HTTP 200 (got ${
        response === null ? "no response" : response.status()
      }) — refusing to audit it.`,
    );
  }
  // Generous on purpose: on a cold Turbopack cache the detail page's client
  // bundle and its API route both compile on first visit, which can take
  // 30s+ after "load" before the seeded content hydrates in. The guard still
  // requires the real content to appear before axe scores anything.
  const deadline = Date.now() + 90_000;
  for (;;) {
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    if (bodyText.includes(expectText)) return;
    if (Date.now() >= deadline) break;
    await page.waitForTimeout(500);
  }
  throw new Error(
    `${url} never rendered the expected content "${expectText}" — the URL no longer resolves to real seeded content, so the audit refuses to score a fallback state.`,
  );
}

export function summarizeViolation(violation: Result): string {
  const nodes = violation.nodes.map((node) => node.target.join(" ")).join("; ");
  return `    [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s)) — ${nodes}`;
}
