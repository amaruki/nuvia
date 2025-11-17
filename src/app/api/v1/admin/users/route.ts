import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { requirePermission } from '@/lib/rbac';
import { AuthResponseFactory, AuthErrorType } from '@/lib/auth/common';
import { prisma } from '@/lib/prisma';
import { ROLE_PERMISSIONS, isPredefinedRole } from '@/types/role.types';

/**
 * GET /api/v1/admin/users - Get users with role information
 * Requires: users:read permission
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const auth = await requirePermission('users:read');

    if (!auth.success) {
      return AuthResponseFactory.error(AuthErrorType.AUTHORIZATION, auth.error || 'UNAUTHORIZED');
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeRoles = searchParams.get('includeRoles') === 'true';

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {};

    // Build role filter
    const roleFilter = role ? { role } : {};

    // Get total count
    const total = await prisma.user.count({
      where: {
        ...searchFilter,
        ...roleFilter
      }
    });

    // Get users
    const users = await prisma.user.findMany({
      where: {
        ...searchFilter,
        ...roleFilter
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      take: limit,
      skip: offset
    });

    // Add permissions if requested
    const usersWithPermissions = users.map(user => {
      let permissions: string[] = [];

      if (isPredefinedRole(user.role)) {
        permissions = ROLE_PERMISSIONS[user.role];
      }

      return {
        ...user,
        permissions: includeRoles ? permissions : undefined
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithPermissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: 'Users retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    });

  } catch (error) {
    console.error('Error getting users:', error);
    return AuthResponseFactory.internalError('Failed to retrieve users');
  }
}

/**
 * POST /api/v1/admin/users - Create a new user
 * Requires: users:create permission
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check
    const auth = await requirePermission('users:create');

    if (!auth.success) {
      return AuthResponseFactory.error(AuthErrorType.AUTHORIZATION, auth.error || 'UNAUTHORIZED');
    }

    // Parse and validate request body
    const body = await request.json();

    const createUserSchema = z.object({
      username: z.string().min(3, 'Username must be at least 3 characters'),
      email: z.string().email('Invalid email address'),
      name: z.string().min(1, 'Name is required'),
      role: z.string().default('user'),
      password: z.string().min(8, 'Password must be at least 8 characters')
    });

    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return AuthResponseFactory.validationError(validationResult.error);
    }

    const { username, email, name, role, password } = validationResult.data;

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return AuthResponseFactory.error(AuthErrorType.BUSINESS_LOGIC, 'Username or email already exists');
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        name,
        role,
        passwordHash: password, // TODO: Hash password properly
        emailVerified: false
      },
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

    return AuthResponseFactory.success({
      user: newUser
    }, 'User created successfully');

  } catch (error) {
    console.error('Error creating user:', error);
    return AuthResponseFactory.internalError('Failed to create user');
  }
}