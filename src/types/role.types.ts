/**
 * Role-Based Access Control (RBAC) System
 *
 * Comprehensive role and permission definitions for the Nuvia AMS platform.
 * Supports predefined roles, custom roles, and granular permissions.
 */

// Import existing ROLE_DISPLAY_INFO from dashboard.types
import { ROLE_DISPLAY_INFO, isPredefinedRole, USER_ROLES } from './dashboard.types';

// Base role types from existing system
export const PREDEFINED_ROLES = [
  'superadmin',
  'admin',
  'staff',
  'treasurer',
  'chapter_president',
  'chapter_admin',
  'committee_chair',
  'organizer',
  'member_corporate',
  'member_professional',
  'member_student',
  'member',
  'moderator',
  'user'
] as const;

// Define UserRole type locally to avoid import issues
export type UserRole =
  | 'superadmin'           // Global system control
  | 'admin'                // Organization-wide management
  | 'staff'                // Operational staff
  | 'treasurer'            // Financial oversight
  | 'chapter_president'    // Chapter leadership
  | 'chapter_admin'        // Chapter administration
  | 'committee_chair'      // Committee leadership
  | 'organizer'            // Event organization
  | 'member_corporate'     // Corporate member tier
  | 'member_professional'  // Professional member tier
  | 'member_student'       // Student member tier
  | 'member'               // Basic member tier
  | 'moderator'            // Content moderation
  | 'user';                // Basic registered user

export type PredefinedRole = UserRole;
export type Role = PredefinedRole | string; // Allow custom roles

// Re-export for convenience
export { ROLE_DISPLAY_INFO, isPredefinedRole, USER_ROLES } from './dashboard.types';

// Permission modules
export const PERMISSION_MODULES = [
  'users',
  'events',
  'memberships',
  'finance',
  'content',
  'communications',
  'analytics',
  'organization',
  'forum',
  'jobs',
  'learning',
  'system'
] as const;

export type PermissionModule = typeof PERMISSION_MODULES[number];

// Permission actions
export const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'manage',
  'publish',
  'approve',
  'export',
  'import',
  'moderate'
] as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[number];

// Granular permission structure
export type Permission = `${PermissionModule}:${PermissionAction}`;

// All available permissions in the system
export const AVAILABLE_PERMISSIONS: Permission[] = [
  // User Management
  'users:create',
  'users:read',
  'users:update',
  'users:delete',
  'users:manage',
  'users:export',
  'users:import',

  // Event Management
  'events:create',
  'events:read',
  'events:update',
  'events:delete',
  'events:manage',
  'events:publish',
  'events:approve',

  // Membership Management
  'memberships:create',
  'memberships:read',
  'memberships:update',
  'memberships:delete',
  'memberships:manage',
  'memberships:approve',
  'memberships:export',

  // Financial Management
  'finance:create',
  'finance:read',
  'finance:update',
  'finance:delete',
  'finance:manage',
  'finance:approve',
  'finance:export',

  // Content Management
  'content:create',
  'content:read',
  'content:update',
  'content:delete',
  'content:manage',
  'content:publish',
  'content:approve',

  // Communications
  'communications:create',
  'communications:read',
  'communications:update',
  'communications:delete',
  'communications:manage',
  'communications:publish',

  // Analytics & Reports
  'analytics:read',
  'analytics:export',
  'analytics:manage',

  // Organization Management
  'organization:create',
  'organization:read',
  'organization:update',
  'organization:delete',
  'organization:manage',

  // Forum Management
  'forum:create',
  'forum:read',
  'forum:update',
  'forum:delete',
  'forum:manage',
  'forum:moderate',

  // Job Board Management
  'jobs:create',
  'jobs:read',
  'jobs:update',
  'jobs:delete',
  'jobs:manage',
  'jobs:approve',

  // Learning Management
  'learning:create',
  'learning:read',
  'learning:update',
  'learning:delete',
  'learning:manage',
  'learning:approve',

  // System Administration
  'system:create',
  'system:read',
  'system:update',
  'system:delete',
  'system:manage'
] as const;

// Predefined role permissions
export const ROLE_PERMISSIONS: Record<PredefinedRole, Permission[]> = {
  superadmin: AVAILABLE_PERMISSIONS, // All permissions

  admin: [
    // Full access except system-level
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:manage',
    'users:export',
    'users:import',
    'events:create',
    'events:read',
    'events:update',
    'events:delete',
    'events:manage',
    'events:publish',
    'events:approve',
    'memberships:create',
    'memberships:read',
    'memberships:update',
    'memberships:delete',
    'memberships:manage',
    'memberships:approve',
    'memberships:export',
    'finance:create',
    'finance:read',
    'finance:update',
    'finance:delete',
    'finance:manage',
    'finance:approve',
    'finance:export',
    'content:create',
    'content:read',
    'content:update',
    'content:delete',
    'content:manage',
    'content:publish',
    'content:approve',
    'communications:create',
    'communications:read',
    'communications:update',
    'communications:delete',
    'communications:manage',
    'communications:publish',
    'analytics:read',
    'analytics:export',
    'analytics:manage',
    'organization:create',
    'organization:read',
    'organization:update',
    'organization:delete',
    'organization:manage',
    'forum:create',
    'forum:read',
    'forum:update',
    'forum:delete',
    'forum:manage',
    'forum:moderate',
    'jobs:create',
    'jobs:read',
    'jobs:update',
    'jobs:delete',
    'jobs:manage',
    'jobs:approve',
    'learning:create',
    'learning:read',
    'learning:update',
    'learning:delete',
    'learning:manage',
    'learning:approve'
  ],

  staff: [
    // Operational access, no user management or system settings
    'events:create',
    'events:read',
    'events:update',
    'events:manage',
    'events:publish',
    'memberships:read',
    'memberships:update',
    'memberships:manage',
    'content:create',
    'content:read',
    'content:update',
    'content:publish',
    'communications:create',
    'communications:read',
    'communications:update',
    'communications:publish',
    'analytics:read',
    'analytics:export',
    'forum:read',
    'forum:manage',
    'forum:moderate',
    'jobs:read',
    'jobs:update',
    'jobs:manage',
    'jobs:approve',
    'learning:read',
    'learning:update',
    'learning:manage',
    'organization:read'
  ],

  treasurer: [
    // Financial focus
    'finance:create',
    'finance:read',
    'finance:update',
    'finance:manage',
    'finance:approve',
    'finance:export',
    'memberships:read',
    'memberships:update',
    'analytics:read',
    'analytics:export',
    'events:read',
    'organization:read'
  ],

  chapter_president: [
    // Chapter-level management
    'users:read',
    'events:create',
    'events:read',
    'events:update',
    'events:manage',
    'events:publish',
    'memberships:read',
    'memberships:update',
    'memberships:manage',
    'memberships:approve',
    'content:create',
    'content:read',
    'content:update',
    'content:publish',
    'communications:create',
    'communications:read',
    'communications:update',
    'communications:publish',
    'analytics:read',
    'forum:create',
    'forum:read',
    'forum:manage',
    'forum:moderate',
    'organization:read',
    'organization:update'
  ],

  chapter_admin: [
    // Chapter administration
    'users:read',
    'events:read',
    'events:update',
    'memberships:read',
    'memberships:update',
    'content:read',
    'content:update',
    'communications:read',
    'communications:update',
    'analytics:read',
    'forum:read',
    'organization:read'
  ],

  committee_chair: [
    // Committee-specific management
    'events:create',
    'events:read',
    'events:update',
    'events:manage',
    'memberships:read',
    'content:create',
    'content:read',
    'content:update',
    'communications:create',
    'communications:read',
    'communications:update',
    'analytics:read',
    'forum:create',
    'forum:read',
    'forum:manage'
  ],

  organizer: [
    // Event organization focus
    'events:create',
    'events:read',
    'events:update',
    'events:manage',
    'events:publish',
    'content:create',
    'content:read',
    'content:update',
    'communications:create',
    'communications:read',
    'communications:update',
    'analytics:read',
    'forum:read'
  ],

  member_corporate: [
    // Corporate member privileges
    'events:read',
    'memberships:read',
    'content:read',
    'communications:read',
    'forum:create',
    'forum:read',
    'jobs:read',
    'learning:read',
    'organization:read'
  ],

  member_professional: [
    // Professional member privileges
    'events:read',
    'memberships:read',
    'content:read',
    'communications:read',
    'forum:create',
    'forum:read',
    'jobs:read',
    'learning:read'
  ],

  member_student: [
    // Student member privileges
    'events:read',
    'memberships:read',
    'content:read',
    'communications:read',
    'forum:create',
    'forum:read',
    'jobs:read',
    'learning:read'
  ],

  member: [
    // Basic member privileges
    'events:read',
    'memberships:read',
    'content:read',
    'communications:read',
    'forum:create',
    'forum:read',
    'organization:read'
  ],

  moderator: [
    // Content moderation focus
    'content:read',
    'content:update',
    'content:delete',
    'forum:read',
    'forum:update',
    'forum:delete',
    'forum:moderate',
    'communications:read'
  ],

  user: [
    // Basic registered user
    'events:read',
    'content:read',
    'communications:read',
    'forum:read',
    'organization:read'
  ]
};

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
  user: 10
};

// Role display information is now in dashboard.types.ts

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  users: {
    name: 'User Management',
    description: 'Manage user accounts and access',
    icon: 'users',
    color: 'blue'
  },
  events: {
    name: 'Event Management',
    description: 'Create and manage events',
    icon: 'calendar',
    color: 'purple'
  },
  memberships: {
    name: 'Membership Management',
    description: 'Manage member subscriptions and tiers',
    icon: 'id-card',
    color: 'green'
  },
  finance: {
    name: 'Financial Management',
    description: 'Handle payments and financial data',
    icon: 'dollar-sign',
    color: 'emerald'
  },
  content: {
    name: 'Content Management',
    description: 'Manage articles and publications',
    icon: 'file-text',
    color: 'orange'
  },
  communications: {
    name: 'Communications',
    description: 'Send announcements and newsletters',
    icon: 'mail',
    color: 'pink'
  },
  analytics: {
    name: 'Analytics & Reports',
    description: 'View analytics and generate reports',
    icon: 'bar-chart',
    color: 'indigo'
  },
  organization: {
    name: 'Organization',
    description: 'Manage organization settings',
    icon: 'building',
    color: 'slate'
  },
  forum: {
    name: 'Forum Management',
    description: 'Moderate discussions and forums',
    icon: 'message-square',
    color: 'cyan'
  },
  jobs: {
    name: 'Job Board',
    description: 'Manage job postings and applications',
    icon: 'briefcase',
    color: 'amber'
  },
  learning: {
    name: 'Learning Management',
    description: 'Manage courses and certifications',
    icon: 'book-open',
    color: 'rose'
  },
  system: {
    name: 'System Administration',
    description: 'System-wide settings and configuration',
    icon: 'settings',
    color: 'red'
  }
} as const;

// Utility functions for role and permission checking
// isPredefinedRole is now imported from dashboard.types

export const getRoleLevel = (role: Role): number => {
  if (isPredefinedRole(role)) {
    return ROLE_HIERARCHY[role];
  }
  return 0; // Custom roles have level 0 by default
};

export const hasHigherRole = (role1: Role, role2: Role): boolean => {
  return getRoleLevel(role1) > getRoleLevel(role2);
};

export const canManageRole = (managerRole: Role, targetRole: Role): boolean => {
  // Superadmin can manage anyone
  if (managerRole === 'superadmin') return true;

  // Cannot manage superadmin unless you are superadmin
  if (targetRole === 'superadmin') return false;

  // Cannot manage same or higher role
  return hasHigherRole(managerRole, targetRole);
};

export const formatPermission = (permission: Permission): string => {
  const [module, action] = permission.split(':');
  const category = PERMISSION_CATEGORIES[module as PermissionModule];
  return `${category?.name || module} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
};