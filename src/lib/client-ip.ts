/**
 * Client IP resolution (security issue #3).
 *
 * Before this module, twelve call sites read the LEFTMOST X-Forwarded-For
 * hop — the hop the *client* appended — so rotating the header bypassed
 * every rate-limit bucket and spoofed audit-log attribution.
 *
 * Model: every reverse proxy between the client and this app APPENDS the
 * IP of the peer it accepted the connection from, so the RIGHTMOST entry
 * is the newest and the only ones added by trusted infrastructure. With
 * `TRUSTED_PROXY_HOPS = N` proxies in front of the app, the client IP is
 * the entry N positions from the right: everything to its left was
 * attacker-supplied content that a proxy forwarded, never trusted.
 *
 *   client (spoofs "evil") → proxy P1 → app, hops = 1
 *   header at the app:  "evil, <client>"     ← resolution returns <client>
 *
 * The same resolver feeds rate limiting AND audit-log attribution — one
 * code path, one trust decision (acceptance criterion: audit writers must
 * not read raw headers).
 *
 * Direct exposure (no proxy): XFF cannot be trusted at all — there is no
 * honest hop that appended anything. `TRUSTED_PROXY_HOPS=0` documents that
 * topology: resolution ignores XFF and falls back to X-Real-IP, then
 * "unknown". Route handlers cannot see the TCP peer address, so a directly
 * exposed deployment should put a proxy in front (compose.prod.yml does) or
 * accept "unknown" as the rate-limit key.
 */

import { env } from "@/lib/env";

const UNKNOWN_IP = "unknown";

/**
 * Resolve the client IP from request headers.
 *
 * @param headers the incoming request's headers
 * @param trustedProxyHops number of trusted proxies between the client and
 *   this app (defaults to env.TRUSTED_PROXY_HOPS). Tests pass it explicitly
 *   to simulate topologies.
 */
export function resolveClientIp(headers: Headers, trustedProxyHops?: number): string {
  const hops = trustedProxyHops ?? env.TRUSTED_PROXY_HOPS;
  const xff = headers.get("x-forwarded-for");

  if (xff && hops > 0) {
    const parts = xff
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (parts.length > 0) {
      // The entry `hops` positions from the right: appended by the outermost
      // trusted proxy (the one that saw the real client). Fewer entries than
      // hops means the request bypassed the proxy chain — clamp to the
      // leftmost entry, the most conservative choice.
      return parts[Math.max(0, parts.length - hops)];
    }
  }

  // hops === 0 falls through on purpose: with no trusted proxy, every XFF
  // entry is attacker-controlled.
  return headers.get("x-real-ip")?.trim() || UNKNOWN_IP;
}

/**
 * Audit contexts store NULL when no IP is determinable (the pre-issue
 * semantic of `?? undefined`). resolveClientIp's "unknown" sentinel maps
 * back to undefined here.
 */
export function resolveClientIpOrUndefined(
  headers: Headers,
  trustedProxyHops?: number,
): string | undefined {
  const ip = resolveClientIp(headers, trustedProxyHops);
  return ip === UNKNOWN_IP ? undefined : ip;
}
