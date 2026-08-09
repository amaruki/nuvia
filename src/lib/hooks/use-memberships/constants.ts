import { MembershipStatus } from "@/types/membership.types";
import type { MembershipSort } from "@/types/membership.types";

import type { MemberApiItem } from "./members-api";

/**
 * Directory status (UI vocabulary) -> derived member statuses (API
 * vocabulary). A CANCELED subscription derives in_grace (paid through) or
 * expired, so both map onto it; ACTIVE covers every entitled derivation.
 */
export const UI_STATUS_TO_MEMBER_STATUSES: Record<
  MembershipStatus,
  readonly MemberApiItem["memberStatus"][]
> = {
  [MembershipStatus.ACTIVE]: ["active", "trialing", "in_grace"],
  [MembershipStatus.EXPIRED]: ["expired"],
  [MembershipStatus.PENDING]: ["none"],
  [MembershipStatus.SUSPENDED]: ["paused"],
  [MembershipStatus.CANCELLED]: ["in_grace", "expired"],
};

export const MEMBER_STATUS_TO_UI_STATUS: Record<MemberApiItem["memberStatus"], MembershipStatus> = {
  active: MembershipStatus.ACTIVE,
  trialing: MembershipStatus.ACTIVE,
  in_grace: MembershipStatus.ACTIVE,
  paused: MembershipStatus.SUSPENDED,
  expired: MembershipStatus.EXPIRED,
  none: MembershipStatus.PENDING,
};

/**
 * MembershipSort field -> API sortBy column. Fields with no real column yet
 * fall back to name ordering rather than faking a sort.
 */
export const API_SORT_BY_FIELD: Record<MembershipSort["field"], string> = {
  name: "name",
  membershipStartDate: "createdAt",
  membershipEndDate: "name",
  membershipTier: "name",
  location: "name",
  company: "name",
};
