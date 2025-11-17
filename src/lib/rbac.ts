/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Provides permission checking, role validation, and access control functions
 * for the Nuvia AMS platform.
 */

import { auth } from './auth';
import { prisma } from './prisma';
import { headers } from 'next/headers';
import {
  Role,
  PredefinedRole,
  Permission,
  ROLE_PERMISSIONS,
  isPredefinedRole,
  canManageRole,
  getRoleLevel
} from '@/types/role.types';
import { AuthError, AuthErrorType } from './auth/common';

// Enhanced user type with role information
export interface UserWithRole {
  id: string;
  email: string;
  username: string;
  name?: string;
  displayName?: string;
  role: Role;
  permissions?: Permission[];
}

// Custom role interface for database storage
export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Role assignment change for audit logging
export interface RoleAssignmentChange {
  userId: string;
  previousRole: Role;
  newRole: Role;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get current user session with role and permissions
 */
export async function getCurrentUser(): Promise<UserWithRole | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return null;
    }

    const user = session.user as any;

    // Get user role from database (in case it's not in session)
    let role = user.role || 'user';

    // Get permissions for the user's role
    let permissions: Permission[] = [];

    if (isPredefinedRole(role)) {
      permissions = ROLE_PERMISSIONS[role as PredefinedRole];
    } else {
      // For custom roles, get permissions from database
      // TODO: Implement customRole model in Prisma schema
      /*
      const customRole = await prisma.customRole.findUnique({
        where: { name: role },
        select: { permissions: true }
      });

      if (customRole) {
        permissions = customRole.permissions as Permission[];
      }
      */

      // For now, give custom roles no permissions
      permissions = [];
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      displayName: user.displayName,
      role,
      permissions
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if current user has specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Superadmin has all permissions
  if (user.role === 'superadmin') {
    return true;
  }

  // Check if user has the specific permission
  return user.permissions?.includes(permission) || false;
}

/**
 * Check if current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Superadmin has all permissions
  if (user.role === 'superadmin') {
    return true;
  }

  return permissions.some(permission =>
    user.permissions?.includes(permission) || false
  );
}

/**
 * Check if current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Superadmin has all permissions
  if (user.role === 'superadmin') {
    return true;
  }

  return permissions.every(permission =>
    user.permissions?.includes(permission) || false
  );
}

/**
 * Check if current user has specific role or higher privilege level
 */
export async function hasRole(minRole: PredefinedRole): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Superadmin always has access
  if (user.role === 'superadmin') {
    return true;
  }

  const userLevel = getRoleLevel(user.role);
  const requiredLevel = getRoleLevel(minRole);

  return userLevel >= requiredLevel;
}

/**
 * Authorization middleware function
 */
export async function requirePermission(permission: Permission): Promise<{
  success: boolean;
  user?: UserWithRole;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: 'UNAUTHORIZED'
      };
    }

    const hasRequiredPermission = await hasPermission(permission);

    if (!hasRequiredPermission) {
      return {
        success: false,
        error: 'FORBIDDEN'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Error in requirePermission:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Authorization middleware for minimum role level
 */
export async function requireRole(minRole: PredefinedRole): Promise<{
  success: boolean;
  user?: UserWithRole;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: 'UNAUTHORIZED'
      };
    }

    const hasRequiredRole = await hasRole(minRole);

    if (!hasRequiredRole) {
      return {
        success: false,
        error: 'FORBIDDEN'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Error in requireRole:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Check if a user can manage another user's role
 */
export async function canManageUserRole(
  managerId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // Get both users
    const [manager, target] = await Promise.all([
      prisma.user.findUnique({
        where: { id: managerId },
        select: { role: true }
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { role: true }
      })
    ]);

    if (!manager || !target) {
      return false;
    }

    // Cannot manage yourself
    if (managerId === targetUserId) {
      return false;
    }

    return canManageRole(manager.role as Role, target.role as Role);
  } catch (error) {
    console.error('Error checking role management permission:', error);
    return false;
  }
}

/**
 * Change user role with validation and audit logging
 */
export async function changeUserRole(
  targetUserId: string,
  newRole: Role,
  changedBy: string,
  reason?: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate that the changer can manage the target user's role
    const canManage = await canManageUserRole(changedBy, targetUserId);

    if (!canManage) {
      return {
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS'
      };
    }

    // Get current role for audit
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true }
    });

    if (!targetUser) {
      return {
        success: false,
        error: 'USER_NOT_FOUND'
      };
    }

    // If role is the same, no change needed
    if (targetUser.role === newRole) {
      return {
        success: true
      };
    }

    // Update user role
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    // Log the role change for audit
    await logRoleAssignmentChange({
      userId: targetUserId,
      previousRole: targetUser.role as Role,
      newRole,
      changedBy,
      changedAt: new Date(),
      reason,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    });

    return {
      success: true
    };
  } catch (error) {
    console.error('Error changing user role:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Log role assignment changes for audit trail
 */
async function logRoleAssignmentChange(change: RoleAssignmentChange): Promise<void> {
  try {
    await prisma.authLog.create({
      data: {
        userId: change.userId,
        eventType: 'ROLE_CHANGE',
        severity: 'INFO',
        message: `Role changed from ${change.previousRole} to ${change.newRole}`,
        ipAddress: change.ipAddress,
        userAgent: change.userAgent,
        metadata: {
          previousRole: change.previousRole,
          newRole: change.newRole,
          changedBy: change.changedBy,
          reason: change.reason
        }
      }
    });
  } catch (error) {
    console.error('Error logging role assignment change:', error);
    // Don't fail the operation if logging fails
  }
}

/**
 * Get role statistics for dashboard
 */
export async function getRoleStatistics(): Promise<{
  totalUsers: number;
  roleDistribution: Record<Role, number>;
  roleBreakdown: Array<{
    role: Role;
    count: number;
    percentage: number;
    displayName: string;
    description: string;
    category: string;
  }>;
}> {
  try {
    // Get role distribution
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    const roleDistribution: Record<string, number> = {};
    let totalUsers = 0;

    roleStats.forEach(stat => {
      roleDistribution[stat.role] = stat._count.role;
      totalUsers += stat._count.role;
    });

    // Get role display info for breakdown
    const { ROLE_DISPLAY_INFO, PREDEFINED_ROLES } = await import('@/types/role.types');

    const roleBreakdown = PREDEFINED_ROLES.map(role => {
      const count = roleDistribution[role] || 0;
      const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
      const roleInfo = ROLE_DISPLAY_INFO[role];

      return {
        role,
        count,
        percentage,
        displayName: roleInfo.name,
        description: roleInfo.description,
        category: roleInfo.category
      };
    }).filter(item => item.count > 0); // Only include roles with users

    return {
      totalUsers,
      roleDistribution,
      roleBreakdown
    };
  } catch (error) {
    console.error('Error getting role statistics:', error);
    return {
      totalUsers: 0,
      roleDistribution: {},
      roleBreakdown: []
    };
  }
}

/**
 * Get all roles (predefined + custom) for UI display
 */
export async function getAllRoles(): Promise<Array<{
  role: Role;
  name: string;
  description?: string;
  isPredefined: boolean;
  userCount: number;
}>> {
  try {
    // Get predefined roles with user counts
    const predefinedRoleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    const roleUserCounts: Record<string, number> = {};
    predefinedRoleStats.forEach(stat => {
      roleUserCounts[stat.role] = stat._count.role;
    });

    // Get predefined roles info
    const { ROLE_DISPLAY_INFO, PREDEFINED_ROLES } = await import('@/types/role.types');

    const roles = PREDEFINED_ROLES.map(role => ({
      role,
      name: ROLE_DISPLAY_INFO[role].name,
      description: ROLE_DISPLAY_INFO[role].description,
      isPredefined: true,
      userCount: roleUserCounts[role] || 0
    }));

    // TODO: Add custom roles when we implement the CustomRole model
    // For now, only return predefined roles

    return roles;
  } catch (error) {
    console.error('Error getting all roles:', error);
    return [];
  }
}

/**
 * Validate role assignment business rules
 */
export function validateRoleAssignment(
  currentRole: Role,
  newRole: Role,
  assignerRole: Role
): {
  valid: boolean;
  reason?: string;
} {
  // Cannot assign superadmin role unless you are superadmin
  if (newRole === 'superadmin' && assignerRole !== 'superadmin') {
    return {
      valid: false,
      reason: 'Only Super Admin can assign Super Admin role'
    };
  }

  // Cannot promote someone to same or higher level than yourself
  if (!canManageRole(assignerRole, newRole)) {
    return {
      valid: false,
      reason: 'Cannot assign role higher than or equal to your own'
    };
  }

  // Special validation for role changes that would privilege escalation
  if (getRoleLevel(newRole) > getRoleLevel(assignerRole)) {
    return {
      valid: false,
      reason: 'Cannot assign role with higher privilege level than your own'
    };
  }

  return {
    valid: true
  };
}

/**
 * Get effective permissions for a user (including role-based and custom permissions)
 */
export async function getUserPermissions(userId: string): Promise<{
  role: Role;
  permissions: Permission[];
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let permissions: Permission[] = [];

    if (isPredefinedRole(user.role as Role)) {
      permissions = ROLE_PERMISSIONS[user.role as PredefinedRole];
    } else {
      // TODO: Get custom role permissions from database
      // For now, return empty permissions for custom roles
    }

    return {
      role: user.role as Role,
      permissions
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      role: 'user',
      permissions: []
    };
  }
}