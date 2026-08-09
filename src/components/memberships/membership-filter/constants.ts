import { MembershipStatus, MembershipTier } from "@/types/membership.types";

export const MEMBERSHIP_TIERS = [
  { value: MembershipTier.BASIC, label: "Basic" },
  { value: MembershipTier.PROFESSIONAL, label: "Professional" },
  { value: MembershipTier.CORPORATE, label: "Corporate" },
  { value: MembershipTier.STUDENT, label: "Student" },
  { value: MembershipTier.VIP, label: "VIP" },
  { value: MembershipTier.PREMIUM, label: "Premium" },
];

export const MEMBERSHIP_STATUSES = [
  { value: MembershipStatus.ACTIVE, label: "Active" },
  { value: MembershipStatus.EXPIRED, label: "Expired" },
  { value: MembershipStatus.PENDING, label: "Pending" },
  { value: MembershipStatus.SUSPENDED, label: "Suspended" },
  { value: MembershipStatus.CANCELLED, label: "Cancelled" },
];
