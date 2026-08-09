/**
 * UI-31 — member home UI state mapping (pure, testable, no DB, no JSX).
 *
 * Turns the real read-model rows from `src/lib/services/member/home.ts` into
 * honest card states. The planning doc's honesty contract is pinned here:
 *
 * - no subscription => "Not a member yet" + join CTA (never fake benefits);
 * - renewal text only ever comes from the real period/trial end dates —
 *   lifetime coverage and paused subscriptions render no date at all;
 * - every CTA points at the real join/renew funnel (`/membership`, UI-33);
 * - event-registration cancellation is offered exactly where the cancel
 *   route allows it (PENDING/CONFIRMED/WAITLISTED);
 * - moderation-pending forum posts/comments are labeled "awaiting review"
 *   instead of being hidden.
 */

import type { MembershipCardData } from "@/lib/services/member/home";

export const MEMBERSHIP_PAGE_HREF = "/membership";

export type MembershipCardStateName =
  | "non_member"
  | "active"
  | "trialing"
  | "in_grace"
  | "paused"
  | "expired";

/** What the surfaced date means — the widget renders the sentence. */
export type RenewalKind = "renews" | "ends" | "trial_ends" | "none";

export interface MembershipCardState {
  state: MembershipCardStateName;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
  renewalKind: RenewalKind;
  /** The real date behind the renewal sentence; null = never invent one. */
  renewalDate: Date | null;
}

export function resolveMembershipCardState(card: MembershipCardData | null): MembershipCardState {
  if (card === null) {
    return {
      state: "non_member",
      headline: "Not a member yet",
      ctaLabel: "Join now",
      ctaHref: MEMBERSHIP_PAGE_HREF,
      renewalKind: "none",
      renewalDate: null,
    };
  }

  switch (card.memberStatus) {
    case "active":
      return {
        state: "active",
        headline: "Membership active",
        ctaLabel: "Manage or renew",
        ctaHref: MEMBERSHIP_PAGE_HREF,
        renewalKind:
          card.currentPeriodEnd === null ? "none" : card.cancelAtPeriodEnd ? "ends" : "renews",
        renewalDate: card.currentPeriodEnd,
      };
    case "trialing": {
      const trialBoundary = card.trialEnd ?? card.currentPeriodEnd;
      return {
        state: "trialing",
        headline: "Trial membership active",
        ctaLabel: "Continue membership",
        ctaHref: MEMBERSHIP_PAGE_HREF,
        renewalKind: trialBoundary === null ? "none" : "trial_ends",
        renewalDate: trialBoundary,
      };
    }
    case "in_grace":
      return {
        state: "in_grace",
        headline: "Membership winding down",
        ctaLabel: "Renew now",
        ctaHref: MEMBERSHIP_PAGE_HREF,
        renewalKind: card.currentPeriodEnd === null ? "none" : "ends",
        renewalDate: card.currentPeriodEnd,
      };
    case "paused":
      return {
        state: "paused",
        headline: "Membership paused",
        ctaLabel: "Manage membership",
        ctaHref: MEMBERSHIP_PAGE_HREF,
        renewalKind: "none",
        renewalDate: null,
      };
    case "expired":
    case "none":
      return {
        state: "expired",
        headline: "Membership expired",
        ctaLabel: "Renew now",
        ctaHref: MEMBERSHIP_PAGE_HREF,
        renewalKind: "none",
        renewalDate: null,
      };
  }
}

// ── Event registrations ─────────────────────────────────────────────────────

export const REGISTRATION_STATUS_LABELS = {
  PENDING: "Pending approval",
  CONFIRMED: "Confirmed",
  WAITLISTED: "Waitlisted",
  CANCELED: "Canceled",
  ATTENDED: "Attended",
  NO_SHOW: "No-show",
} as const satisfies Record<string, string>;

export type RegistrationStatusLabelKey = keyof typeof REGISTRATION_STATUS_LABELS;

/**
 * The cancel route accepts the owner's own registration while it is still
 * live; attended/no-show/canceled rows have nothing to cancel.
 */
export function isRegistrationCancelable(status: string): boolean {
  return status === "PENDING" || status === "CONFIRMED" || status === "WAITLISTED";
}

// ── Forum moderation state ──────────────────────────────────────────────────

/** Forum posts use PENDING_REVIEW, comments use PENDING for the same state. */
export function isForumItemAwaitingReview(status: string): boolean {
  return status === "PENDING_REVIEW" || status === "PENDING";
}
