// Permission modules
export const PERMISSION_MODULES = [
  "users",
  "events",
  "memberships",
  "finance",
  "content",
  "communications",
  "analytics",
  "organization",
  "forum",
  "jobs",
  "learning",
  "chapters",
  "committees",
  "awards",
  "workspaces",
  "system",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

// Permission actions
export const PERMISSION_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
  "publish",
  "approve",
  "export",
  "import",
  "moderate",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

// Granular permission structure
export type Permission = `${PermissionModule}:${PermissionAction}`;
