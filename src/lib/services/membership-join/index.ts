/**
 * UI-33 — membership join funnel service (decision D10).
 *
 * Public catalog projection (catalog.ts), self-serve join/renew checkout
 * with honest manual fallback (join.ts), and the application/review track
 * (applications.ts). `../membership-join.service.ts` stays as a re-export
 * shim for the historical specifier.
 */

export { getPublicTier, listPublicTiers, type PublicMembershipTier } from "./catalog";
export {
  MANUAL_JOIN_GUIDANCE,
  joinMembership,
  renewMembershipCheckout,
  selectJoinTrack,
  type JoinMembershipInput,
  type JoinMembershipResult,
  type JoinTrack,
  type RenewCheckoutInput,
  type RenewCheckoutResult,
} from "./join";
export {
  createMembershipApplication,
  listMembershipApplications,
  reviewMembershipApplication,
  type ApplicationDecision,
  type ApplicationListItem,
  type ApplicationListFilters,
  type ApplicationWithTierName,
  type CreateApplicationInput,
} from "./applications";
