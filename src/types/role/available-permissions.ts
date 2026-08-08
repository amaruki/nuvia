import type { Permission } from "./permission-types";

// All available permissions in the system
export const AVAILABLE_PERMISSIONS: Permission[] = [
  // User Management
  "users:create",
  "users:read",
  "users:update",
  "users:delete",
  "users:manage",
  "users:export",
  "users:import",

  // Event Management
  "events:create",
  "events:read",
  "events:update",
  "events:delete",
  "events:manage",
  "events:publish",
  "events:approve",

  // Membership Management
  "memberships:create",
  "memberships:read",
  "memberships:update",
  "memberships:delete",
  "memberships:manage",
  "memberships:approve",
  "memberships:export",

  // Financial Management
  "finance:create",
  "finance:read",
  "finance:update",
  "finance:delete",
  "finance:manage",
  "finance:approve",
  "finance:export",

  // Content Management
  "content:create",
  "content:read",
  "content:update",
  "content:delete",
  "content:manage",
  "content:publish",
  "content:approve",

  // Communications
  "communications:create",
  "communications:read",
  "communications:update",
  "communications:delete",
  "communications:manage",
  "communications:publish",

  // Analytics & Reports
  "analytics:read",
  "analytics:export",
  "analytics:manage",

  // Organization Management
  "organization:create",
  "organization:read",
  "organization:update",
  "organization:delete",
  "organization:manage",

  // Forum Management
  "forum:create",
  "forum:read",
  "forum:update",
  "forum:delete",
  "forum:manage",
  "forum:moderate",

  // Job Board Management
  "jobs:create",
  "jobs:read",
  "jobs:update",
  "jobs:delete",
  "jobs:manage",
  "jobs:approve",

  // Learning Management
  "learning:create",
  "learning:read",
  "learning:update",
  "learning:delete",
  "learning:manage",
  "learning:approve",

  // Chapter Management
  "chapters:create",
  "chapters:read",
  "chapters:update",
  "chapters:delete",
  "chapters:manage",

  // Committee Management
  "committees:create",
  "committees:read",
  "committees:update",
  "committees:delete",
  "committees:manage",

  // Awards Management
  "awards:create",
  "awards:read",
  "awards:update",
  "awards:delete",
  "awards:manage",

  // Workspaces Management
  "workspaces:create",
  "workspaces:read",
  "workspaces:update",
  "workspaces:delete",
  "workspaces:manage",

  // System Administration
  "system:create",
  "system:read",
  "system:update",
  "system:delete",
  "system:manage",
] as const;
