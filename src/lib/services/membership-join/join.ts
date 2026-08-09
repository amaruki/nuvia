/**
 * UI-33 — join/renew funnel: track selection and checkout logic.
 *
 * Decision D10 offers two tracks; this module owns the self-serve one and
 * degrades honestly when no gateway is configured:
 *
 *  - Stripe track  — create the subscription (so the checkout session can
 *    echo its id for the webhook), then open a hosted checkout. Until the
 *    verified webhook arrives the funnel reports "pending", never "paid".
 *    If checkout creation fails the subscription is canceled immediately —
 *    no live row is left without a payable session.
 *  - Manual track  — no gateway means no self-serve payment. We return
 *    offline-payment guidance and nothing else: NO subscription row, NO
 *    ManualGateway.createCheckout call (that settles "completed" on the
 *    spot and would fake a success), paymentStatus stays "unpaid".
 *
 * The gateway is injectable (test seam, mirrors processGatewayWebhook);
 * production callers let resolvePaymentGateway() decide.
 */

import type { MembershipSubscription } from "@/db/schema";
import { GatewayError, toMinorUnits, type PaymentGateway } from "@/lib/payments/gateway";
import { resolvePaymentGateway } from "@/lib/payments/gateway";
import {
  cancelSubscription,
  createSubscription,
  getSubscription,
  type ActorContext,
} from "@/lib/services/subscription.service";
import { LIVE_STATUSES } from "@/lib/services/subscription/helpers";
import { getTier } from "@/lib/services/membership-tier.service";
import { getPublicTier, type PublicMembershipTier } from "./catalog";

export type JoinTrack = "stripe" | "manual";

/**
 * The one place the funnel decides which track serves this deployment. The
 * manual gateway has no hosted checkout, so "stripe" is the only self-serve
 * provider; anything else degrades to the honest manual path.
 */
export function selectJoinTrack(gateway: PaymentGateway = resolvePaymentGateway()): JoinTrack {
  return gateway.provider === "stripe" ? "stripe" : "manual";
}

/**
 * Honest offline-payment copy for deployments without a configured gateway.
 * No prices are fabricated here — the tier card already shows the tier's own
 * price; this text only explains how payment actually happens.
 */
export const MANUAL_JOIN_GUIDANCE: readonly string[] = [
  "Online payment is not set up for this organization yet.",
  "Membership is activated manually: pay by bank transfer or check, then the membership team confirms your payment and activates your tier.",
  "You will not be charged on this website, and no payment has been recorded yet.",
];

export interface JoinMembershipInput {
  userId: string;
  tierId: string;
  /** Where the provider sends the member back after hosted checkout. */
  returnUrl?: string;
  /** Test seam; production resolves from PAYMENT_GATEWAY. */
  gateway?: PaymentGateway;
}

export type JoinMembershipResult =
  | {
      track: "stripe";
      /** Pending until the verified webhook confirms the charge. */
      paymentStatus: "pending";
      subscription: MembershipSubscription;
      checkoutUrl: string;
      providerTxId: string | null;
    }
  | {
      track: "manual";
      /** Nothing was charged and nothing will settle on its own. */
      paymentStatus: "unpaid";
      subscription: null;
      checkoutUrl: null;
      providerTxId: null;
      guidance: readonly string[];
    };

export async function joinMembership(
  input: JoinMembershipInput,
  actor: ActorContext,
): Promise<JoinMembershipResult> {
  const gateway = input.gateway ?? resolvePaymentGateway();
  // Public-projection gate: unknown and inactive tiers both 404.
  const tier = await getPublicTier(input.tierId);

  if (selectJoinTrack(gateway) === "manual") {
    return {
      track: "manual",
      paymentStatus: "unpaid",
      subscription: null,
      checkoutUrl: null,
      providerTxId: null,
      guidance: MANUAL_JOIN_GUIDANCE,
    };
  }

  // Stripe track: the session metadata must carry the subscription id so the
  // webhook can renew it — create first, compensate on checkout failure.
  const { subscription } = await createSubscription(
    { userId: input.userId, tierId: tier.id, trialDays: 0 },
    actor,
  );

  try {
    const checkout = await createCheckoutFor(gateway, {
      userId: input.userId,
      subscription,
      tier,
      returnUrl: input.returnUrl,
    });
    return {
      track: "stripe",
      paymentStatus: "pending",
      subscription,
      checkoutUrl: checkout.checkoutUrl,
      providerTxId: checkout.providerTxId,
    };
  } catch (error) {
    await cancelSubscription(subscription.id, {
      ...actor,
      reason: "Checkout creation failed; compensating join",
    });
    throw error;
  }
}

export interface RenewCheckoutInput {
  userId: string;
  subscriptionId: string;
  returnUrl?: string;
  /** Test seam; production resolves from PAYMENT_GATEWAY. */
  gateway?: PaymentGateway;
}

export type RenewCheckoutResult =
  | {
      track: "stripe";
      paymentStatus: "pending";
      checkoutUrl: string;
      providerTxId: string | null;
    }
  | {
      track: "manual";
      paymentStatus: "unpaid";
      checkoutUrl: null;
      providerTxId: null;
      guidance: readonly string[];
    };

/**
 * Open a renewal checkout for a live subscription. No new row is created up
 * front — the verified success webhook drives renewSubscription (ADR-0014:
 * renewal swaps in a NEW row).
 */
export async function renewMembershipCheckout(
  input: RenewCheckoutInput,
  _actor: ActorContext,
): Promise<RenewCheckoutResult> {
  const gateway = input.gateway ?? resolvePaymentGateway();

  // Both tracks renew a real, live subscription — resolve and validate it
  // before any track decision so a dead row is refused honestly everywhere.
  const subscription = await getSubscription(input.subscriptionId);
  // Never confirm to a different member that someone else's row exists.
  if (subscription.userId !== input.userId || !LIVE_STATUSES.includes(subscription.status)) {
    throw new GatewayError(
      "This subscription cannot be renewed through checkout",
      "RENEWAL_NOT_AVAILABLE",
    );
  }

  if (selectJoinTrack(gateway) === "manual") {
    return {
      track: "manual",
      paymentStatus: "unpaid",
      checkoutUrl: null,
      providerTxId: null,
      guidance: MANUAL_JOIN_GUIDANCE,
    };
  }

  const tier = await getTier(subscription.tierId);
  const checkout = await createCheckoutFor(gateway, {
    userId: input.userId,
    subscription,
    tier,
    returnUrl: input.returnUrl,
  });
  return {
    track: "stripe",
    paymentStatus: "pending",
    checkoutUrl: checkout.checkoutUrl,
    providerTxId: checkout.providerTxId,
  };
}

/** Shared checkout-session creation with the no-URL failure made explicit. */
async function createCheckoutFor(
  gateway: PaymentGateway,
  args: {
    userId: string;
    subscription: MembershipSubscription;
    tier: Pick<PublicMembershipTier, "id" | "displayName" | "price" | "billingCycle">;
    returnUrl?: string;
  },
): Promise<{ checkoutUrl: string; providerTxId: string | null }> {
  const checkout = await gateway.createCheckout({
    userId: args.userId,
    subscriptionId: args.subscription.id,
    tierId: args.tier.id,
    tierName: args.tier.displayName,
    amountMinor: toMinorUnits(args.tier.price),
    currency: "USD",
    description: `${args.tier.displayName} membership (${args.tier.billingCycle})`,
    returnUrl: args.returnUrl,
    metadata: { subscriptionId: args.subscription.id, tierId: args.tier.id },
  });

  if (!checkout.checkoutUrl) {
    throw new GatewayError("The gateway produced no hosted checkout URL", "CHECKOUT_FAILED");
  }
  return { checkoutUrl: checkout.checkoutUrl, providerTxId: checkout.providerTxId };
}
