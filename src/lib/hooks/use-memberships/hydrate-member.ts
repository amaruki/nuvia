import { MembershipTier } from "@/types/membership.types";
import type { MembershipProfile } from "@/types/membership.types";

import { MEMBER_STATUS_TO_UI_STATUS } from "./constants";
import type { MemberApiItem } from "./members-api";

/** Tier from the subscription's tier name, falling back to the member role
 * suffix (member_student -> student, etc.) and finally BASIC. */
function tierForMember(member: MemberApiItem): MembershipTier {
  switch (member.subscription?.tierName?.toLowerCase()) {
    case MembershipTier.PROFESSIONAL:
      return MembershipTier.PROFESSIONAL;
    case MembershipTier.CORPORATE:
      return MembershipTier.CORPORATE;
    case MembershipTier.STUDENT:
      return MembershipTier.STUDENT;
    case MembershipTier.VIP:
      return MembershipTier.VIP;
    case MembershipTier.PREMIUM:
      return MembershipTier.PREMIUM;
    case MembershipTier.BASIC:
      return MembershipTier.BASIC;
    default:
      break;
  }
  switch (member.role) {
    case "member_corporate":
      return MembershipTier.CORPORATE;
    case "member_professional":
      return MembershipTier.PROFESSIONAL;
    case "member_student":
      return MembershipTier.STUDENT;
    default:
      return MembershipTier.BASIC;
  }
}

export function toMembershipProfile(member: MemberApiItem): MembershipProfile {
  const nameParts = member.name.split(" ");
  const sub = member.subscription;
  return {
    id: member.id,
    username: member.username,
    email: member.email,
    firstName: member.firstName ?? nameParts[0] ?? "",
    lastName: member.lastName ?? nameParts.slice(1).join(" "),
    avatar: member.image ?? undefined,
    profilePhoto: member.image ?? undefined,
    bio: member.bio ?? undefined,
    location: "", // no location column in the users schema yet
    membershipTier: tierForMember(member),
    membershipStatus: MEMBER_STATUS_TO_UI_STATUS[member.memberStatus],
    membershipStartDate: sub ? new Date(sub.currentPeriodStart) : new Date(member.createdAt),
    membershipEndDate: sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
    applicationDate: new Date(member.createdAt),
    lastRenewalDate: sub ? new Date(sub.createdAt) : undefined,
    memberId: `M-${member.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    joinDate: new Date(member.createdAt),
  };
}
