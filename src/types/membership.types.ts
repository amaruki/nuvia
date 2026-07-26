/**
 * Membership types for the AMS platform
 * Defines membership profiles, filters, and sorting options
 */

import { UserProfile, UserRole } from "./dashboard.types";

export enum MembershipTier {
  BASIC = "basic",
  PROFESSIONAL = "professional",
  CORPORATE = "corporate",
  STUDENT = "student",
  VIP = "vip",
  PREMIUM = "premium",
}

export enum MembershipStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  PENDING = "pending",
  SUSPENDED = "suspended",
  CANCELLED = "cancelled",
}

export interface MembershipProfile extends UserProfile {
  /** Membership tier information */
  membershipTier: MembershipTier;
  /** Current membership status */
  membershipStatus: MembershipStatus;
  /** Date when membership started */
  membershipStartDate: Date;
  /** Date when membership expires or null for lifetime */
  membershipEndDate: Date | null;
  /** Chapter or local organization affiliation */
  chapter?: string;
  /** Geographic location */
  location: string;
  /** Company or organization */
  company?: string;
  /** Job title or position */
  jobTitle?: string;
  /** Professional bio */
  bio?: string;
  /** Membership application date */
  applicationDate: Date;
  /** Last renewal date */
  lastRenewalDate?: Date;
  /** Member ID number */
  memberId: string;
  /** Profile photo URL */
  avatar?: string;
  /** Contact information */
  phone?: string;
  /** Social links */
  linkedin?: string;
  website?: string;
  /** Skills or expertise */
  skills?: string[];
  /** Interests for networking */
  interests?: string[];
  /** Committee memberships */
  committees?: string[];
}

export interface MembershipFilter {
  /** Search query for name, email, company */
  search?: string;
  /** Filter by membership tiers */
  tiers?: MembershipTier[];
  /** Filter by membership status */
  statuses?: MembershipStatus[];
  /** Filter by location/chapter */
  locations?: string[];
  /** Filter by committees */
  committees?: string[];
  /** Date range for membership start */
  startDateRange?: {
    from: Date;
    to: Date;
  };
  /** Date range for membership end */
  endDateRange?: {
    from: Date;
    to: Date;
  };
  /** Filter by skills */
  skills?: string[];
}

export interface MembershipSort {
  field:
    | "name"
    | "membershipStartDate"
    | "membershipEndDate"
    | "membershipTier"
    | "location"
    | "company";
  direction: "asc" | "desc";
}

export interface MembershipDirectoryResponse {
  members: MembershipProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MembershipStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  pendingMembers: number;
  tierDistribution: Record<MembershipTier, number>;
  newMembersThisMonth: number;
  renewalRate: number;
}

export interface MembershipApplication {
  id: string;
  userId: string;
  requestedTier: MembershipTier;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  applicationDate: Date;
  reviewDate?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}
