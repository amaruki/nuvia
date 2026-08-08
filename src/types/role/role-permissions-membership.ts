import type { Permission } from "./permission-types";

export const MEMBERSHIP_ROLE_PERMISSIONS: Record<
  | "chapter_president"
  | "chapter_admin"
  | "committee_chair"
  | "organizer"
  | "member_corporate"
  | "member_professional"
  | "member_student"
  | "member"
  | "moderator"
  | "user",
  Permission[]
> = {
  chapter_president: [
    // Chapter-level management
    "users:read",
    "events:create",
    "events:read",
    "events:update",
    "events:manage",
    "events:publish",
    "memberships:read",
    "memberships:update",
    "memberships:manage",
    "memberships:approve",
    "content:create",
    "content:read",
    "content:update",
    "content:publish",
    "communications:create",
    "communications:read",
    "communications:update",
    "communications:publish",
    "analytics:read",
    "forum:create",
    "forum:read",
    "forum:manage",
    "forum:moderate",
    "chapters:read",
    "chapters:update",
    "chapters:manage",
    "organization:read",
    "organization:update",
  ],

  chapter_admin: [
    // Chapter administration
    "users:read",
    "events:read",
    "events:update",
    "memberships:read",
    "memberships:update",
    "content:read",
    "content:update",
    "communications:read",
    "communications:update",
    "analytics:read",
    "forum:read",
    "chapters:read",
    "chapters:update",
    "organization:read",
  ],

  committee_chair: [
    // Committee-specific management
    "events:create",
    "events:read",
    "events:update",
    "events:manage",
    "memberships:read",
    "content:create",
    "content:read",
    "content:update",
    "communications:create",
    "communications:read",
    "communications:update",
    "analytics:read",
    "forum:create",
    "forum:read",
    "forum:manage",
    "committees:read",
    "committees:update",
    "committees:manage",
  ],

  organizer: [
    // Event organization focus
    "events:create",
    "events:read",
    "events:update",
    "events:manage",
    "events:publish",
    "content:create",
    "content:read",
    "content:update",
    "communications:create",
    "communications:read",
    "communications:update",
    "analytics:read",
    "forum:read",
  ],

  member_corporate: [
    // Corporate member privileges
    "events:read",
    "memberships:read",
    "content:read",
    "communications:read",
    "forum:create",
    "forum:read",
    "jobs:read",
    "learning:read",
    "chapters:read",
    "committees:read",
    "awards:read",
    "workspaces:read",
    "organization:read",
  ],

  member_professional: [
    // Professional member privileges
    "events:read",
    "memberships:read",
    "content:read",
    "communications:read",
    "forum:create",
    "forum:read",
    "jobs:read",
    "learning:read",
    "chapters:read",
    "committees:read",
    "awards:read",
    "workspaces:read",
  ],

  member_student: [
    // Student member privileges
    "events:read",
    "memberships:read",
    "content:read",
    "communications:read",
    "forum:create",
    "forum:read",
    "jobs:read",
    "learning:read",
    "chapters:read",
    "committees:read",
    "awards:read",
    "workspaces:read",
  ],

  member: [
    // Basic member privileges
    "events:read",
    "memberships:read",
    "content:read",
    "communications:read",
    "forum:create",
    "forum:read",
    "organization:read",
  ],

  moderator: [
    // Content moderation focus
    "content:read",
    "content:update",
    "content:delete",
    "forum:read",
    "forum:update",
    "forum:delete",
    "forum:moderate",
    "communications:read",
  ],

  user: [
    // Basic registered user
    "events:read",
    "content:read",
    "communications:read",
    "forum:read",
    "organization:read",
  ],
};
