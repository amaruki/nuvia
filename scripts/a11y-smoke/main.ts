/** Gate orchestration: stack, seed, dev server, sign-in, audits, summary. */

import { randomBytes } from "node:crypto";
import { closeSync } from "node:fs";
import { chromium } from "playwright";
import type { Browser } from "playwright";

import { auditPage, signIn, summarizeViolation } from "./audit";
import type { PageReport } from "./audit";
import { OUTPUT_DIR, PAGES } from "./config";
import { ensureDevServer, stopDevServer } from "./dev-server";
import { log } from "./helpers";
import { ensureTestStack, flushRateLimitState, seedAdmin } from "./infrastructure";

export async function main(): Promise<void> {
  await Bun.write(`${OUTPUT_DIR}/.keep`, "");
  log(`Output directory: ${OUTPUT_DIR}`);

  // Per-run password: strong enough for validatePasswordStrength, never reused.
  const password = `A11ySmoke!${randomBytes(12).toString("base64url")}`;
  await ensureTestStack();
  await flushRateLimitState();
  await seedAdmin(password);

  const { server, logFd, baseUrl } = await ensureDevServer();
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ baseURL: baseUrl });
    await signIn(context, password, baseUrl);

    const reports: PageReport[] = [];
    for (const target of PAGES) {
      log(`Auditing ${target.path} …`);
      const report = await auditPage(context, target, baseUrl);
      reports.push(report);
      await Bun.write(
        `${OUTPUT_DIR}/axe-${target.slug}.json`,
        JSON.stringify(report.violations, null, 2),
      );
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    let failingTotal = 0;
    let reportOnlyTotal = 0;

    console.log("\n[a11y-smoke] === axe results (WCAG 2.2 AA tags) ===");
    for (const report of reports) {
      failingTotal += report.failing.length;
      reportOnlyTotal += report.reportOnly.length;
      const status = report.failing.length === 0 ? "PASS" : "FAIL";
      console.log(
        `[a11y-smoke] ${status} ${report.path} — ${report.failing.length} critical/serious, ${report.reportOnly.length} moderate/minor`,
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

    console.log(
      `\n[a11y-smoke] Total: ${failingTotal} critical/serious (fail gate), ${reportOnlyTotal} moderate/minor (report-only). Raw results: ${OUTPUT_DIR}`,
    );

    if (failingTotal > 0) {
      throw new Error(
        `WCAG 2.2 AA gate failed: ${failingTotal} critical/serious axe violation(s).`,
      );
    }
    log("WCAG 2.2 AA gate passed.");
  } finally {
    if (browser) await browser.close();
    if (server) {
      log("Stopping dev server…");
      await stopDevServer(server);
    }
    if (logFd !== null) closeSync(logFd);
  }
}
