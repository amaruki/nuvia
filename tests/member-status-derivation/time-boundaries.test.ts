/**
 * Tests for ADR-0014: member status is derived from the membership
 * subscription lifecycle, never stored independently.
 *
 * The time boundaries the pure derivation mapping depends on, exercised
 * with fixed timestamps.
 */

import { describe, expect, test } from "bun:test";
import {
  PAST_DUE_GRACE_DAYS,
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

describe("deriveMemberStatus — time boundaries the mapping depends on", () => {
  test("ACTIVE past its period end derives expired even before the provider notices", () => {
    const sub = snapshot("ACTIVE", { currentPeriodEnd: daysFromNow(-1) });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("ACTIVE with an unset period end derives active", () => {
    const sub = snapshot("ACTIVE", { currentPeriodEnd: null });
    expect(deriveMemberStatus(sub, NOW)).toBe("active");
  });

  test("TRIALING past the trial end derives expired", () => {
    const sub = snapshot("TRIALING", {
      trialEnd: daysFromNow(-1),
      currentPeriodEnd: daysFromNow(5),
    });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("CANCELED past the paid-through period derives expired", () => {
    const sub = snapshot("CANCELED", { currentPeriodEnd: daysFromNow(-1) });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("CANCELED with an unset period end derives expired", () => {
    const sub = snapshot("CANCELED", { currentPeriodEnd: null });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("PAST_DUE past the grace window derives expired", () => {
    const sub = snapshot("PAST_DUE", { currentPeriodEnd: daysFromNow(-(PAST_DUE_GRACE_DAYS + 1)) });
    expect(deriveMemberStatus(sub, NOW)).toBe("expired");
  });

  test("PAST_DUE with an unset period end derives in_grace — no anchor proves lapse", () => {
    const sub = snapshot("PAST_DUE", { currentPeriodEnd: null });
    expect(deriveMemberStatus(sub, NOW)).toBe("in_grace");
  });
});
