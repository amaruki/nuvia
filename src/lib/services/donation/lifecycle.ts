/**
 * Donation lifecycle transitions (issue #27, finding 3).
 *
 * Before this table existed, `updateDonation` accepted ANY status on every
 * PATCH, so a treasurer could flip a `refunded` gift back to `pending` or
 * mark an already-`completed` donation as `pledged` again. Revenue reports
 * then counted the same money twice or counted money that was returned.
 *
 * The table mirrors the enum's documented lifecycle:
 * - `pledged` is a promise to pay; it becomes `pending` once the donor
 *   starts paying, or `completed` when the cash lands.
 * - `pending` is money in flight; it resolves to `completed`, `failed`, or
 *   straight to `refunded` (charge reversed before confirmation).
 * - `completed` money only leaves via `refunded`.
 * - `failed` payments can be retried (`pending`).
 * - `refunded` is terminal — money already left, no resurrection.
 *
 * No-op updates (same status) are allowed so PATCH payloads can resubmit
 * the current state without error, matching the content/forum convention.
 */
import { BusinessLogicError } from "@/lib/errors";
import type { DonationStatus } from "@/db/schema/donations";

/** Legal forward moves for each donation status. */
export const DONATION_TRANSITIONS: Record<DonationStatus, readonly DonationStatus[]> = {
  pledged: ["pending", "completed", "failed"],
  pending: ["completed", "failed", "refunded"],
  completed: ["refunded"],
  failed: ["pending"],
  refunded: [],
};

/** Terminal statuses have no exits. */
export const TERMINAL_DONATION_STATUSES: readonly DonationStatus[] = ["refunded"];

/**
 * Throws BusinessLogicError(INVALID_TRANSITION) when `toStatus` is not a
 * legal move from `fromStatus`. Same-status updates always pass (no-op).
 */
export function assertDonationTransition(
  fromStatus: DonationStatus,
  toStatus: DonationStatus,
): void {
  if (fromStatus === toStatus) return;
  if (!DONATION_TRANSITIONS[fromStatus]?.includes(toStatus)) {
    throw new BusinessLogicError(
      `Cannot change donation status from '${fromStatus}' to '${toStatus}'`,
      "INVALID_TRANSITION",
    );
  }
}
