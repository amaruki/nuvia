/**
 * User Management types for the AMS platform
 * Defines user profiles, filters, and management operations
 */

import { UserRole } from "./dashboard.types";

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
  BANNED = "banned",
}

export enum AuthStatus {
  VERIFIED = "verified",
  UNVERIFIED = "unverified",
  TWO_FACTOR_ENABLED = "two_factor_enabled",
  TWO_FACTOR_DISABLED = "two_factor_disabled",
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  timezone?: string;
  language?: string;
  userRole: UserRole;
  status: UserStatus;
  authStatus: AuthStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserFilter {
  /** Search query for name, email, username */
  search?: string;
  /** Filter by user roles */
  roles?: UserRole[];
  /** Filter by user status */
  statuses?: UserStatus[];
  /** Filter by authentication status */
  authStatuses?: AuthStatus[];
  /** Filter by email verification */
  emailVerified?: boolean;
  /** Filter by phone verification */
  phoneVerified?: boolean;
  /** Date range for user registration */
  registrationDateRange?: {
    from: Date;
    to: Date;
  };
  /** Date range for last login */
  lastLoginRange?: {
    from: Date;
    to: Date;
  };
  /** Filter by location */
  locations?: string[];
}

export interface UserSort {
  field: "name" | "email" | "userRole" | "status" | "createdAt" | "lastLoginAt";
  direction: "asc" | "desc";
}

export interface UserManagementResponse {
  users: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersWithTwoFactor: number;
  roleDistribution: Record<UserRole, number>;
  newUsersThisMonth: number;
  usersLastLogin30Days: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType:
    | "login"
    | "logout"
    | "profile_update"
    | "password_change"
    | "role_change"
    | "security_event";
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  location?: string;
}

export interface UserManagementAction {
  type:
    | "suspend"
    | "activate"
    | "ban"
    | "unban"
    | "change_role"
    | "verify_email"
    | "verify_phone"
    | "reset_password"
    | "force_logout";
  userId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface BulkUserAction {
  type: UserManagementAction["type"];
  userIds: string[];
  reason?: string;
  metadata?: Record<string, any>;
}
