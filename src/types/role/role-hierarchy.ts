import type { PredefinedRole } from "./role-definitions";

// Role hierarchy for inheritance (higher number = higher privilege)
export const ROLE_HIERARCHY: Record<PredefinedRole, number> = {
  superadmin: 100,
  admin: 90,
  staff: 80,
  treasurer: 75,
  chapter_president: 70,
  chapter_admin: 65,
  committee_chair: 60,
  organizer: 55,
  moderator: 50,
  member_corporate: 40,
  member_professional: 35,
  member_student: 30,
  member: 25,
  user: 10,
};

// Role display information is now in dashboard.types.ts
