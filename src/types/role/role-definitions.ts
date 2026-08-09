// Base role types from existing system
export const PREDEFINED_ROLES = [
  "superadmin",
  "admin",
  "staff",
  "treasurer",
  "chapter_president",
  "chapter_admin",
  "committee_chair",
  "organizer",
  "member_corporate",
  "member_professional",
  "member_student",
  "member",
  "moderator",
  "user",
] as const;

// Define UserRole type locally to avoid import issues
export type UserRole =
  | "superadmin" // Global system control
  | "admin" // Organization-wide management
  | "staff" // Operational staff
  | "treasurer" // Financial oversight
  | "chapter_president" // Chapter leadership
  | "chapter_admin" // Chapter administration
  | "committee_chair" // Committee leadership
  | "organizer" // Event organization
  | "member_corporate" // Corporate member tier
  | "member_professional" // Professional member tier
  | "member_student" // Student member tier
  | "member" // Basic member tier
  | "moderator" // Content moderation
  | "user" // Basic registered user
  | "demo"; // Disposable demo-instance visitor (UI-39); custom role, not in PREDEFINED_ROLES

export type PredefinedRole = UserRole;
export type Role = PredefinedRole | string; // Allow custom roles

// Re-export for convenience
export { ROLE_DISPLAY_INFO, isPredefinedRole, USER_ROLES } from "../dashboard.types";
