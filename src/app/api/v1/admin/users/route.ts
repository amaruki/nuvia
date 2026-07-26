import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { and, count, desc, asc, eq, ilike, or } from "drizzle-orm";
import { requirePermission } from "@/lib/rbac";
import { AuthResponseFactory, AuthErrorType } from "@/lib/auth/common";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { ROLE_PERMISSIONS, isPredefinedRole } from "@/types/role.types";

/**
 * GET /api/v1/admin/users - Get users with role information
 * Requires: users:read permission
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const auth = await requirePermission("users:read");

    if (!auth.success) {
      return AuthResponseFactory.error(AuthErrorType.AUTHORIZATION, auth.error || "UNAUTHORIZED");
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const includeRoles = searchParams.get("includeRoles") === "true";

    // Build search filter — case-insensitive OR across three columns
    const searchFilter = search
      ? or(
          ilike(user.username, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(user.name, `%${search}%`),
        )
      : undefined;

    // Build role filter
    const roleFilter = role ? eq(user.role, role) : undefined;
    const whereClause = and(searchFilter, roleFilter);

    // Get total count
    const [{ value: total }] = await db.select({ value: count() }).from(user).where(whereClause);

    // Get users
    const sortColumns = {
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as const;
    const sortColumn = sortColumns[sortBy as keyof typeof sortColumns] ?? user.createdAt;
    const sortDirection = sortOrder === "asc" ? asc : desc;

    const users = await db
      .select({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(sortDirection(sortColumn))
      .limit(limit)
      .offset(offset);

    // Add permissions if requested
    const usersWithPermissions = users.map((user) => {
      let permissions: string[] = [];

      if (isPredefinedRole(user.role)) {
        permissions = ROLE_PERMISSIONS[user.role];
      }

      return {
        ...user,
        permissions: includeRoles ? permissions : undefined,
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
          totalPages: Math.ceil(total / limit),
        },
      },
      message: "Users retrieved successfully",
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1",
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return AuthResponseFactory.internalError("Failed to retrieve users");
  }
}

/**
 * POST /api/v1/admin/users - Create a new user
 * Requires: users:create permission
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check
    const auth = await requirePermission("users:create");

    if (!auth.success) {
      return AuthResponseFactory.error(AuthErrorType.AUTHORIZATION, auth.error || "UNAUTHORIZED");
    }

    // Parse and validate request body
    const body = await request.json();

    const createUserSchema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      email: z.string().email("Invalid email address"),
      name: z.string().min(1, "Name is required"),
      role: z.string().default("user"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return AuthResponseFactory.validationError(validationResult.error);
    }

    const { username, email, name, role, password } = validationResult.data;

    // Check if username or email already exists
    const existingUser = await db.query.user.findFirst({
      where: or(eq(user.username, username), eq(user.email, email)),
    });

    if (existingUser) {
      return AuthResponseFactory.error(
        AuthErrorType.BUSINESS_LOGIC,
        "Username or email already exists",
      );
    }

    // Create user
    // TODO: this bypasses better-auth entirely and stores the raw password as
    // passwordHash — it is not hashed. Pre-existing issue, not introduced by
    // the Drizzle migration; tracked in TODO.md alongside the other admin
    // user-creation gaps.
    const [newUser] = await db
      .insert(user)
      .values({
        username,
        email,
        name,
        role,
        passwordHash: password,
        emailVerified: false,
      })
      .returning({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    return AuthResponseFactory.success(
      {
        user: newUser,
      },
      "User created successfully",
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return AuthResponseFactory.internalError("Failed to create user");
  }
}
