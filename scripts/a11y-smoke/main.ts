/** Gate orchestration: stack, seed, dev server, sign-in, light + dark audits, summary. */

import { randomBytes } from "node:crypto";
import { closeSync } from "node:fs";
import { chromium } from "playwright";
import type { Browser } from "playwright";

import { auditPage, signIn, summarizeViolation } from "./audit";
import type { PageReport } from "./audit";
import { DYNAMIC_PAGES, OUTPUT_DIR, PAGES, THEMES, THEME_STORAGE_KEY } from "./config";
import type { PageTarget } from "./config";
import { ensureDemoContent, resolveDynamicPaths } from "./demo-content";
import { log } from "./helpers";
import { ensureServer, stopServer } from "./server";
import { ensureTestStack, flushRateLimitState, seedAdmin } from "./infrastructure";

export async function main(): Promise<void> {
  await Bun.write(`${OUTPUT_DIR}/.keep`, "");
  log(`Output directory: ${OUTPUT_DIR}`);

  // Per-run password: strong enough for validatePasswordStrength, never reused.
  const password = `A11ySmoke!${randomBytes(12).toString("base64url")}`;
  await ensureTestStack();
  await flushRateLimitState();
  await seedAdmin(password);
  await ensureDemoContent();

  const { server, logFd, baseUrl } = await ensureServer();
  let browser: Browser | null = null;

  try {
    const dynamicPaths = await resolveDynamicPaths();
    const pages: PageTarget[] = [
      ...PAGES,
      ...DYNAMIC_PAGES.map((dynamic) => ({
        slug: dynamic.slug,
        path: dynamicPaths[dynamic.kind],
        module: dynamic.module,
        auth: dynamic.auth,
        expectText: dynamic.expectText,
      })),
    ];

    // Use the Chrome build that ships preinstalled on GitHub-hosted
    // ubuntu runners (channel: "chrome") instead of a Playwright-managed
    // browser download: no `playwright install` step, no download budget,
    // and one less moving part to starve the runner (the job previously
    // died mid-audit from exactly that). Locally this means the gate
    // needs a Chrome/Chromium on PATH, matching what CI exercises.
    browser = await chromium.launch({ channel: "chrome" });
    const reports: PageReport[] = [];

    // One full pass per theme (UI-10): a fresh context per pass seeds
    // next-themes' localStorage key via addInitScript before any page script
    // runs, and next-themes' blocking inline script applies data-theme
    // before first paint. auditPage proves the attribute per page.
    for (const theme of THEMES) {
      log(`--- ${theme} theme pass (${pages.length} pages) ---`);
      const context = await browser.newContext({ baseURL: baseUrl });
      await context.addInitScript(
        ([storageKey, value]) => window.localStorage.setItem(storageKey, value),
        [THEME_STORAGE_KEY, theme],
      );
      await signIn(context, password, baseUrl);

      for (const target of pages) {
        // Two passes double the API traffic; keep the buckets empty so the
        // 100-requests/15-minutes backstop (active when the gate spawns its
        // own Redis-backed server) never trips mid-audit.
        await flushRateLimitState(true);
        log(`[${theme}] Auditing ${target.path} …`);
        const report = await auditPage(context, target, baseUrl, theme);
        reports.push(report);
        await Bun.write(
          `${OUTPUT_DIR}/axe-${theme}-${target.slug}.json`,
          JSON.stringify(report.violations, null, 2),
        );
      }
      await context.close();
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    let failingTotal = 0;
    let reportOnlyTotal = 0;

    console.log("\n[a11y-smoke] === axe results (WCAG 2.2 AA tags; light + dark passes) ===");
    for (const report of reports) {
      failingTotal += report.failing.length;
      reportOnlyTotal += report.reportOnly.length;
      const status = report.failing.length === 0 ? "PASS" : "FAIL";
      console.log(
        `[a11y-smoke] ${status} [${report.theme}] ${report.path} — ${report.failing.length} critical/serious, ${report.reportOnly.length} moderate/minor`,
      );
      for (const violation of report.failing) console.log(summarizeViolation(violation));
      for (const violation of report.reportOnly) console.log(summarizeViolation(violation));
    }

    await Bun.write(
      `${OUTPUT_DIR}/summary.json`,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl,
          pages: reports.map((report) => ({
            theme: report.theme,
            slug: report.slug,
            module: report.module,
            path: report.path,
            failing: report.failing.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              nodes: violation.nodes.length,
            })),
            reportOnly: report.reportOnly.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              nodes: violation.nodes.length,
            })),
          })),
        },
        null,
        2,
      ),
    );

    const perTheme = THEMES.map((theme) => {
      const themeReports = reports.filter((report) => report.theme === theme);
      const failing = themeReports.reduce((sum, report) => sum + report.failing.length, 0);
      const reportOnly = themeReports.reduce((sum, report) => sum + report.reportOnly.length, 0);
      return `${theme}: ${failing} critical/serious, ${reportOnly} moderate/minor`;
    }).join(" | ");

    console.log(
      `\n[a11y-smoke] Total: ${failingTotal} critical/serious (fail gate), ${reportOnlyTotal} moderate/minor (report-only) — ${perTheme}. Raw results: ${OUTPUT_DIR}`,
    );

    if (failingTotal > 0) {
      throw new Error(
        `WCAG 2.2 AA gate failed: ${failingTotal} critical/serious axe violation(s) across the ${THEMES.join(" + ")} passes.`,
      );
    }
    log("WCAG 2.2 AA gate passed.");
  } finally {
    if (browser) await browser.close();
    if (server) {
      log("Stopping audited server…");
      await stopServer(server);
    }
    if (logFd !== null) closeSync(logFd);
  }
}
