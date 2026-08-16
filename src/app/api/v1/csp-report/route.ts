/**
 * CSP violation report sink (security issue #2, acceptance criterion 3).
 *
 * `report-uri` in src/lib/csp.ts points browsers here. Each report is one
 * JSON POST body: a top-level `csp-report` object (report-uri shape) or,
 * for newer agents, a CSP violation `body` inside a reporting payload
 * (report-to shape). Both are logged with the same fields; nothing is
 * persisted. The route is public (reports arrive with the violating page's
 * cookies, but no session is required to log) and IP-rate-limited so a
 * flooded reporter can't turn the endpoint into a log-disk attack.
 *
 * Always returns 204: a report endpoint must never add load to a page that
 * is already misbehaving, and there is nothing useful to tell the browser.
 */

import { logger } from "@/lib/logger";
import { rateLimitOrProblem } from "@/lib/rate-limit";

interface CspReportFields {
  "document-uri"?: string;
  "blocked-uri"?: string;
  "effective-directive"?: string;
  "violated-directive"?: string;
  "original-policy"?: string;
  "script-sample"?: string;
  disposition?: string;
}

/** Trim a report field so one hostile payload can't bloat a log line. */
function clip(value: unknown, max = 300): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export async function POST(request: Request): Promise<Response> {
  // Client IP comes from the request's own headers (x-forwarded-for, added
  // by the platform) rather than next/headers — keeps the route testable
  // outside a Next request scope and avoids an extra async hop.
  const rateLimited = await rateLimitOrProblem(new Headers(request.headers), "cspReport");
  if (rateLimited) return rateLimited;

  let report: CspReportFields | undefined;
  try {
    const parsed = (await request.json()) as {
      "csp-report"?: CspReportFields;
      body?: CspReportFields & { blockedURL?: string; effectiveDirective?: string };
      type?: string;
    };
    // report-uri wraps in `csp-report`; report-to uses `body` (+ `type`).
    report = parsed["csp-report"] ?? (parsed.type === "csp-violation" ? parsed.body : undefined);
  } catch {
    // Non-JSON or empty body — nothing to log, still 204.
    return new Response(null, { status: 204 });
  }

  if (report) {
    // `violated-directive` (report-uri) and `effective-directive`
    // (report-to) carry the same information under different names.
    logger.warn("CSP violation", {
      documentUri: clip(report["document-uri"]),
      blockedUri: clip(report["blocked-uri"] ?? (report as { blockedURL?: string }).blockedURL),
      effectiveDirective: clip(
        report["effective-directive"] ??
          report["violated-directive"] ??
          (report as { effectiveDirective?: string }).effectiveDirective,
      ),
      // The first 40 chars of the blocked inline source — enough to spot
      // which component leaked without logging whole payloads.
      scriptSample: clip(report["script-sample"], 40),
      disposition: clip(report["disposition"], 20),
    });
  }

  return new Response(null, { status: 204 });
}
