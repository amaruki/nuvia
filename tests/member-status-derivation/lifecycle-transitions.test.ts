/**
 * Tests for ADR-0014: member status is derived from the membership
 * subscription lifecycle, never stored independently.
 *
 * One case per lifecycle transition of the pure derivation, exercised
 * with fixed timestamps.
 */

import { describe, expect, test } from "bun:test";
import {
  deriveMemberStatus,
  type SubscriptionSnapshot,
} from "@/lib/services/membership-status.service";

const DAY = 86_400_000;
const NOW = new Date("2026-03-15T12:00:00Z");

const daysFromNow = (days: number): Date => new Date(NOW.getTime() + days * DAY);

const snapshot = (
  status: SubscriptionSnapshot["status"],
  overrides: Partial<SubscriptionSnapshot> = {},
): SubscriptionSnapshot => ({
  status,
  currentPeriodEnd: daysFromNow(30),
  trialEnd: null,
  ...overrides,
});

describe("deriveMemberStatus — one case per lifecycle transition (ADR-0014 mapping)", () => {
  test("no subscription row derives none", () => {
    expect(deriveMemberStatus(null, NOW)).toBe("none");
  });

  test("ACTIVE inside the paid period derives active", () => {
    expect(deriveMemberStatus(snapshot("ACTIVE"), NOW)).toBe("active");
  });

  test("TRIALING inside the trial window derives trialing", () => {
    const sub = snapshot("TRIALING", {
      trialEnd: daysFromNow(5),
      currentPeriodEnd: daysFromNow(5),
    });
    expect(deriveMemberStatus(sub, NOW)).toBe("trialing");
  });

  test("CANCELED inside the paid-through period derives in_grace", () => {
    expect(deriveMemberStatus(snapshot("CANCELED"), NOW)).toBe("in_grace");
  });

  test("PAST_DUE inside the retry grace window derives in_grace", () => {
    const sub = snapshot("PAST_DUE", { currentPeriodEnd: daysFromNow(-1) });
    expect(deriveMemberStatus(sub, NOW)).toBe("in_grace");
  });

  test("UNPAID derives expired — every payment attempt failed, no grace", () => {
    expect(deriveMemberStatus(snapshot("UNPAID"), NOW)).toBe("expired");
  });

  test("PAUSED derives paused", () => {
    expect(deriveMemberStatus(snapshot("PAUSED"), NOW)).toBe("paused");
  });
});
