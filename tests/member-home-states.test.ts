/**
 * UI-31 — member home honesty contract (pure, no database).
 *
 * Pins the UI-state mapping in src/components/dashboard/widgets/member-home-states.ts:
 * the membership card never fabricates renewal dates, non-members get the
 * honest "Not a member yet" state with the join CTA, every CTA points at the
 * real /membership funnel, event-registration statuses map to human labels
 * with cancellation offered only where the cancel route actually allows it
 * (PENDING/CONFIRMED/WAITLISTED), and forum items awaiting moderation are
 * flagged as "awaiting review" instead of being hidden.
 */

import { describe, expect, test } from "bun:test";
import type { MembershipCardData } from "@/lib/services/member/home";
import {
  REGISTRATION_STATUS_LABELS,
  isForumItemAwaitingReview,
  isRegistrationCancelable,
  resolveMembershipCardState,
} from "@/components/dashboard/widgets/member-home-states";

const DAY = 86_400_000;
const NOW = new Date();

function card(overrides: Partial<MembershipCardData>): MembershipCardData {
  return {
    memberStatus: "active",
    subscriptionStatus: "ACTIVE",
    tierDisplayName: "Professional",
    tierBillingCycle: "yearly",
    currentPeriodStart: new Date(NOW.getTime() - 10 * DAY),
    currentPeriodEnd: new Date(NOW.getTime() + 355 * DAY),
    trialEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

describe("resolveMembershipCardState — non-member", () => {
  test("null card yields the honest 'Not a member yet' state with a join CTA", () => {
    const state = resolveMembershipCardState(null);
    expect(state.state).toBe("non_member");
    expect(state.headline).toBe("Not a member yet");
    expect(state.ctaHref).toBe("/membership");
    expect(state.ctaLabel.toLowerCase()).toContain("join");
    // No fabricated entitlement details for non-members.
    expect(state.renewalDate).toBeNull();
  });
});

describe("resolveMembershipCardState — subscription states", () => {
  test("ACTIVE renews on the real period end date", () => {
    const periodEnd = new Date(NOW.getTime() + 355 * DAY);
    const state = resolveMembershipCardState(card({ currentPeriodEnd: periodEnd }));
    expect(state.state).toBe("active");
    expect(state.renewalKind).toBe("renews");
    expect(state.renewalDate!.getTime()).toBe(periodEnd.getTime());
    expect(state.headline.toLowerCase()).toContain("active");
    expect(state.ctaHref).toBe("/membership");
  });

  test("ACTIVE with cancelAtPeriodEnd surfaces an end date, not a renewal", () => {
    const state = resolveMembershipCardState(card({ cancelAtPeriodEnd: true }));
    expect(state.state).toBe("active");
    expect(state.renewalKind).toBe("ends");
    expect(state.ctaHref).toBe("/membership");
  });

  test("lifetime coverage (no period end) never fabricates a renewal date", () => {
    const state = resolveMembershipCardState(card({ currentPeriodEnd: null }));
    expect(state.state).toBe("active");
    expect(state.renewalKind).toBe("none");
    expect(state.renewalDate).toBeNull();
  });

  test("trialing members see their trial end date and a continue CTA", () => {
    const trialEnd = new Date(NOW.getTime() + 3 * DAY);
    const state = resolveMembershipCardState(
      card({ memberStatus: "trialing", subscriptionStatus: "TRIALING", trialEnd }),
    );
    expect(state.state).toBe("trialing");
    expect(state.renewalKind).toBe("trial_ends");
    expect(state.renewalDate!.getTime()).toBe(trialEnd.getTime());
    expect(state.ctaHref).toBe("/membership");
  });

  test("in_grace members get a renew CTA", () => {
    const state = resolveMembershipCardState(
      card({
        memberStatus: "in_grace",
        subscriptionStatus: "CANCELED",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(NOW.getTime() + 5 * DAY),
      }),
    );
    expect(state.state).toBe("in_grace");
    expect(state.renewalKind).toBe("ends");
    expect(state.ctaLabel.toLowerCase()).toContain("renew");
    expect(state.ctaHref).toBe("/membership");
  });

  test("paused members see the paused state without invented dates", () => {
    const state = resolveMembershipCardState(
      card({ memberStatus: "paused", subscriptionStatus: "PAUSED", currentPeriodEnd: null }),
    );
    expect(state.state).toBe("paused");
    expect(state.renewalKind).toBe("none");
    expect(state.renewalDate).toBeNull();
    expect(state.ctaHref).toBe("/membership");
  });

  test("expired members get a renew CTA", () => {
    const state = resolveMembershipCardState(
      card({
        memberStatus: "expired",
        subscriptionStatus: "UNPAID",
        currentPeriodEnd: new Date(NOW.getTime() - 2 * DAY),
      }),
    );
    expect(state.state).toBe("expired");
    expect(state.ctaLabel.toLowerCase()).toContain("renew");
    expect(state.ctaHref).toBe("/membership");
  });
});

describe("event registration labels + cancellability (UI-31)", () => {
  test("every registration status has a human label", () => {
    expect(REGISTRATION_STATUS_LABELS.PENDING).toBeTruthy();
    expect(REGISTRATION_STATUS_LABELS.CONFIRMED).toBeTruthy();
    expect(REGISTRATION_STATUS_LABELS.WAITLISTED).toBeTruthy();
    expect(REGISTRATION_STATUS_LABELS.CANCELED).toBeTruthy();
    expect(REGISTRATION_STATUS_LABELS.ATTENDED).toBeTruthy();
    expect(REGISTRATION_STATUS_LABELS.NO_SHOW).toBeTruthy();
  });

  test("cancellation is offered exactly where the cancel route allows it", () => {
    // POST /api/v1/events/[id]/registrations/[registrationId]/cancel rejects
    // anything that is already attended/no-show/canceled.
    expect(isRegistrationCancelable("PENDING")).toBe(true);
    expect(isRegistrationCancelable("CONFIRMED")).toBe(true);
    expect(isRegistrationCancelable("WAITLISTED")).toBe(true);
    expect(isRegistrationCancelable("CANCELED")).toBe(false);
    expect(isRegistrationCancelable("ATTENDED")).toBe(false);
    expect(isRegistrationCancelable("NO_SHOW")).toBe(false);
  });
});

describe("forum moderation flags (UI-31)", () => {
  test("pending forum posts and comments are flagged awaiting review", () => {
    expect(isForumItemAwaitingReview("PENDING_REVIEW")).toBe(true);
    expect(isForumItemAwaitingReview("PENDING")).toBe(true);
    expect(isForumItemAwaitingReview("PUBLISHED")).toBe(false);
  });
});
