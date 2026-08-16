/**
 * Security issue #3 — rate-limit key spoofing via X-Forwarded-For.
 *
 * Pins the trusted-hop resolution model and replays the audit's exact
 * bypass: with one trusted proxy in front (TRUSTED_PROXY_HOPS=1), rotating
 * the LEFTMOST (client-controlled) XFF entry must not open fresh rate-limit
 * buckets, because every bucket keys on the entry the proxy appended.
 *
 * NOTE: IPs here are unique per run (timestamp-derived), NOT testIp() —
 * bun runs test files concurrently and two files calling testIp() would
 * mint the same 10.0.0.x addresses and collide in the shared Redis
 * rate-limit buckets.
 */

import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

import { POST as login } from "@/app/api/v1/auth/login/route";
import { proxy } from "@/proxy";
import { resolveClientIp, resolveClientIpOrUndefined } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";

/** Timestamp-unique client IP — see file-level note. The counter suffix
 * guards same-millisecond calls within this file. */
let uniqueCounter = 0;
function uniqueIp(): string {
  const t = Date.now();
  uniqueCounter += 1;
  return `172.24.${(t >> 8) & 255}.${(t + uniqueCounter) & 255}`;
}

function headersWith(headers: Record<string, string>): Headers {
  return new Headers(headers);
}

describe("resolveClientIp — trusted-hop model", () => {
  test("one proxy: the proxy-appended (rightmost) entry wins, spoofed prefix ignored", () => {
    const h = headersWith({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" });
    expect(resolveClientIp(h, 1)).toBe("203.0.113.9");
  });

  test("two proxies: first untrusted entry from the right", () => {
    // Chain: client -> P1 -> P2 -> app. P2 appended 203.0.113.10 (P1's
    // address), P1 appended 203.0.113.9 (the client). hops=2 => client.
    const h = headersWith({ "x-forwarded-for": "evil.spoofed, 203.0.113.9, 203.0.113.10" });
    expect(resolveClientIp(h, 2)).toBe("203.0.113.9");
  });

  test("fewer entries than hops: clamp to leftmost (most conservative)", () => {
    const h = headersWith({ "x-forwarded-for": "203.0.113.9" });
    expect(resolveClientIp(h, 3)).toBe("203.0.113.9");
  });

  test("hops=0 (directly exposed): XFF is attacker content, never trusted", () => {
    const h = headersWith({
      "x-forwarded-for": "1.2.3.4, 203.0.113.9",
      "x-real-ip": "203.0.113.50",
    });
    expect(resolveClientIp(h, 0)).toBe("203.0.113.50");
    expect(resolveClientIp(headersWith({ "x-forwarded-for": "1.2.3.4" }), 0)).toBe("unknown");
  });

  test("whitespace and empty entries are normalized away", () => {
    const h = headersWith({ "x-forwarded-for": "  , 203.0.113.9 ,, 203.0.113.10 " });
    expect(resolveClientIp(h, 1)).toBe("203.0.113.10");
  });

  test("no XFF: falls back to x-real-ip, then unknown", () => {
    expect(resolveClientIp(headersWith({ "x-real-ip": "203.0.113.7" }), 1)).toBe("203.0.113.7");
    expect(resolveClientIp(headersWith({}), 1)).toBe("unknown");
  });

  test("OrUndefined variant maps the sentinel back to undefined", () => {
    expect(resolveClientIpOrUndefined(headersWith({}), 1)).toBeUndefined();
    expect(resolveClientIpOrUndefined(headersWith({ "x-forwarded-for": "203.0.113.9" }), 1)).toBe(
      "203.0.113.9",
    );
  });
});

describe("issue #3 — spoofed-XFF brute-force replay (audit reproduction)", () => {
  // The audit's live repro: 6 login attempts from one spoofed IP -> 429,
  // 7th attempt with a ROTATED spoofed IP -> 401 (limit bypassed). After the
  // fix every attempt below carries the same rightmost "real" hop — the one
  // a single trusted proxy would append — so rotating the leftmost entry
  // must keep hitting the same bucket.
  test("rotating the client-controlled XFF prefix does not bypass the login bucket", async () => {
    const realHop = uniqueIp(); // the IP the trusted proxy appended
    const attempt = (spoofedPrefix: string) =>
      login(
        new Request("http://localhost:3000/api/v1/auth/login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": `${spoofedPrefix}, ${realHop}`,
          },
          body: JSON.stringify({
            emailOrUsername: "no-such-user@example.test",
            password: "wrong-password",
          }),
        }) as never,
      );

    // 5 allowed, 6th denied (RATE_LIMITS.login = 5 per 15min).
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      statuses.push((await attempt(`10.66.0.${i}`))!.status);
    }
    expect(statuses.slice(0, 5).every((s) => s !== 429)).toBe(true);
    expect(statuses[5]).toBe(429);

    // The audit's bypass step: rotate the spoofed prefix. Under the old
    // leftmost read this opened a fresh bucket and returned 401. Now the
    // bucket is keyed on `realHop`, so it must stay 429.
    for (let i = 0; i < 3; i += 1) {
      expect((await attempt(`192.0.2.${i + 1}`))!.status).toBe(429);
    }
  });

  test("a genuinely different client IP still gets a fresh bucket", async () => {
    const otherClient = uniqueIp();
    const res = await login(
      new Request("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `10.66.1.1, ${otherClient}`,
        },
        body: JSON.stringify({
          emailOrUsername: "no-such-user@example.test",
          password: "wrong-password",
        }),
      }) as never,
    );
    expect(res!.status).not.toBe(429);
  });
});

describe("issue #3 — rate-limit keys collapse on the resolved IP", () => {
  test("two spoofed prefixes sharing one real hop resolve to one rate-limit key", async () => {
    const realHop = uniqueIp();
    const ip1 = resolveClientIp(headersWith({ "x-forwarded-for": `10.77.0.1, ${realHop}` }));
    const ip2 = resolveClientIp(headersWith({ "x-forwarded-for": `10.77.0.2, ${realHop}` }));
    // The two requests differ only in attacker-controlled content.
    expect(ip1).toBe(realHop);
    expect(ip2).toBe(realHop);

    // One bucket, one window: the second request is limited.
    const key = `spoof-shared:${ip1}`;
    const config = { windowSeconds: 60, max: 1 };
    const first = await checkRateLimit(key, config);
    const second = await checkRateLimit(key, config);
    expect(first.limited).toBe(false);
    expect(second.limited).toBe(true);
  });
});

describe("issue #3 — proxy normalizes x-forwarded-for for every downstream consumer", () => {
  // NextResponse.next({ request: { headers } }) serializes overridden
  // request headers as x-middleware-request-<name>; asserting on that header
  // proves what route handlers and better-auth's limiter actually receive.
  test("a spoofed two-hop chain arrives downstream as the single resolved IP", async () => {
    const realHop = uniqueIp();
    const request = new NextRequest("http://localhost:3112/api/v1/csp-report", {
      method: "POST",
      headers: {
        "x-forwarded-for": `6.6.6.6, ${realHop}`,
        "content-type": "application/csp-report",
      },
      body: "{}",
    });

    const response = await proxy(request);
    expect(response.headers.get("x-middleware-request-x-forwarded-for")).toBe(realHop);
  });
});
