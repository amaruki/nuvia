/**
 * Content Security Policy (security issue #2).
 *
 * Production HTML pages ship a nonce-based CSP: every inline script Next.js
 * emits (the next-themes bootstrap, the RSC flight payload, the hydration
 * bootstrap) carries a per-request nonce, and `script-src` allows ONLY
 * `'self'` and that nonce. `'unsafe-inline'` is gone, so an injected inline
 * `<script>` or event handler is blocked by the browser — the XSS defenses
 * from issues #1/#6 are no longer negated at the browser layer.
 *
 * Wiring (three cooperating pieces — keep them in sync):
 *  1. src/proxy.ts generates a nonce per request, puts the policy on the
 *     REQUEST headers (Next's app renderer reads the incoming CSP header via
 *     getScriptNonceFromHeader and tags every script it injects) and on the
 *     RESPONSE headers (what the browser enforces).
 *  2. src/app/layout.tsx exports `dynamic = "force-dynamic"` so every page
 *     renders per request — static HTML baked at build time cannot receive a
 *     per-request nonce, which is what forced the move away from the
 *     prerendered pages.
 *  3. src/app/layout.tsx passes the nonce to next-themes' ThemeProvider so
 *     its FOUC-prevention bootstrap script is CSP-legal too.
 *
 * Dev keeps `'unsafe-inline' 'unsafe-eval'` (Next's dev overlay and HMR need
 * them); the issue targets production only.
 */

export const CSP_HEADER = "content-security-policy";

/**
 * External image origins allowed by `img-src`. Keep in sync with
 * `images.remotePatterns` in next.config.ts — anything the app renders
 * through next/image must be listed here or the browser blocks it.
 * (Issue #2 acceptance: img-src is an explicit allowlist, not `https:`.)
 */
export const IMG_SRC_ALLOWLIST = [
  "https://images.unsplash.com",
  "https://upload.wikimedia.org",
  "https://picsum.photos",
  // OAuth avatar host (Google) — see socialProviders in src/lib/auth/core.ts.
  "https://lh3.googleusercontent.com",
];

/**
 * Same source-expression shape Next.js's own getScriptNonceFromHeader
 * accepts (base64 alphabet, optional trailing '=' padding) — the nonce we
 * generate must round-trip through that parser or Next would render every
 * page without nonces and the policy would block its own scripts.
 */
const NONCE_SOURCE_REGEX = /^'nonce-([A-Za-z0-9+/]+={0,2})'$/;

export interface CspOptions {
  /** Per-request nonce; omitted only in dev (dev keeps unsafe-inline). */
  nonce?: string;
  /** Development mode: allow unsafe-inline/unsafe-eval for the dev overlay. */
  dev?: boolean;
  /** Absolute path of the violation-report endpoint (report-uri). */
  reportUri?: string;
}

export function buildCsp(options: CspOptions): string {
  const scriptSrc = options.dev
    ? // Next's dev overlay + HMR bootstrap need both in development.
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : options.nonce
      ? // Issue #2: no 'unsafe-inline'. Only same-origin files and scripts
        // carrying this request's nonce execute.
        `script-src 'self' 'nonce-${options.nonce}'`
      : // Defensive fallback (nonce missing): refuse inline entirely rather
        // than silently falling back to unsafe-inline.
        "script-src 'self'";

  const directives = [
    "default-src 'self'",
    scriptSrc,
    // Radix/shadcn set inline style attributes at runtime — styles stay
    // inline-permissive (issue #2 scopes the hardening to scripts + img).
    "style-src 'self' 'unsafe-inline'",
    // blob: covers URL.createObjectURL previews (profile photo + learning
    // settings uploads); data: covers inline SVG placeholders.
    `img-src 'self' data: blob: ${IMG_SRC_ALLOWLIST.join(" ")}`,
    "font-src 'self' data:",
    // Dev HMR talks to the dev server over a websocket.
    options.dev ? "connect-src 'self' ws:" : "connect-src 'self'",
    // Present-and-correct in the pre-issue policy — do not regress.
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (options.reportUri) {
    directives.push(`report-uri ${options.reportUri}`);
  }

  return directives.join("; ");
}

export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Extract the nonce from an incoming CSP header — mirrors Next.js's own
 * getScriptNonceFromHeader (script-src first, default-src fallback) so the
 * root layout sees exactly the nonce Next used to tag its scripts.
 */
export function getCspNonceFromHeader(cspHeaderValue: string | null): string | undefined {
  if (!cspHeaderValue) return undefined;
  const directives = cspHeaderValue.split(";").map((directive) => directive.trim());
  const directive =
    directives.find((dir) => dir.startsWith("script-src")) ??
    directives.find((dir) => dir.startsWith("default-src"));
  if (!directive) return undefined;
  for (const source of directive.split(/\s+/).slice(1)) {
    const match = source.trim().match(NONCE_SOURCE_REGEX);
    if (match) return match[1];
  }
  return undefined;
}
