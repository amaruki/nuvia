import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { requirePermission } from '@/lib/rbac';
import { changeUserRole, getCurrentUser } from '@/lib/rbac';
import { AuthResponseFactory, AuthErrorType } from '@/lib/auth/common';

/**
 * PATCH /api/v1/admin/users/[id]/role - Update user role
 * Requires: users:update permission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  try {
    // Authorization check
    const auth = await requirePermission('users:update');

    if (!auth.success) {
      return AuthResponseFactory.error(AuthErrorType.AUTHORIZATION, auth.error || 'UNAUTHORIZED');
    }

    // targetUserId is already extracted from params above
    const currentUser = auth.user;

    if (!currentUser) {
      return AuthResponseFactory.error(AuthErrorType.AUTHENTICATION, 'Unauthorized');
    }

    // Cannot change your own role
    if (targetUserId === currentUser.id) {
      return AuthResponseFactory.error(AuthErrorType.BUSINESS_LOGIC, 'Cannot change your own role');
    }

    // Parse and validate request body
    const body = await request.json();

    const updateRoleSchema = z.object({
      role: z.string().min(1, 'Role is required'),
      reason: z.string().optional()
    });

    const validationResult = updateRoleSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return AuthResponseFactory.validationError(validationResult.error);
    }

    const { role, reason } = validationResult.data;

    // Get request metadata for audit logging
    const requestHeaders = request.headers;
    const ipAddress = requestHeaders.get('x-forwarded-for') ||
                     requestHeaders.get('x-real-ip') ||
                     'unknown';
    const userAgent = requestHeaders.get('user-agent') || 'unknown';

    // Change user role
    const result = await changeUserRole(
      targetUserId,
      role,
      currentUser.id,
      reason,
      {
        ipAddress,
        userAgent
      }
    );

    if (!result.success) {
      const errorMap: Record<string, { status: number; message: string }> = {
        'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'You do not have permission to manage this user\'s role' },
        'USER_NOT_FOUND': { status: 404, message: 'User not found' },
        'INTERNAL_ERROR': { status: 500, message: 'An unexpected error occurred' }
      };

      const error = errorMap[result.error || 'INTERNAL_ERROR'] ||
                   errorMap['INTERNAL_ERROR'];

      return NextResponse.json(
        {
          success: false,
          data: null,
          message: error.message,
          errors: [{ field: 'role', message: error.message }],
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1'
          }
        },
        { status: error.status }
      );
    }

    return AuthResponseFactory.success({
      userId: targetUserId,
      newRole: role,
      changedBy: currentUser.id,
      changedAt: new Date()
    }, 'User role updated successfully');

  } catch (error) {
    console.error('Error updating user role:', error);
    return AuthResponseFactory.internalError('Failed to update user role');
  }
}

/**
 * GET /api/v1/admin/users/[id]/role - Get user's current role and permissions
 * Requires: users:read permission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  try {
    // Authorization check
    const auth = await requirePermission('users:read');

    if (!auth.success) {
      return AuthResponseFactory.error(AuthErrorType.AUTHORIZATION, auth.error || 'UNAUTHORIZED');
    }

    // targetUserId is already extracted from params above

    // Get user permissions
    const { getUserPermissions } = await import('@/lib/rbac');
    const userPermissions = await getUserPermissions(targetUserId);

    // Get user basic info
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return AuthResponseFactory.error(AuthErrorType.NOT_FOUND, 'User not found');
    }

    return AuthResponseFactory.success({
      user: {
        ...user,
        permissions: userPermissions.permissions
      }
    }, 'User role and permissions retrieved successfully');

  } catch (error) {
    console.error('Error getting user role:', error);
    return AuthResponseFactory.internalError('Failed to retrieve user role');
  }
}