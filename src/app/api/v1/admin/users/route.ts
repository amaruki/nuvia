import { NextRequest } from "next/server";
import { z } from "zod";
import { and, count, desc, asc, eq, ilike, or } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { resolveClientIp } from "@/lib/client-ip";
import { checkRoleAssignable, requirePermission } from "@/lib/rbac";
import { problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { db } from "@/db/client";
import { authLog, user } from "@/db/schema";
import { ROLE_PERMISSIONS, isPredefinedRole } from "@/types/role";

/**
 * GET /api/v1/admin/users - Get users with role information
 * Requires: users:read permission
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const auth = await requirePermission("users:read");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    // Get search parameters — parseInt("abc") is NaN, which would flow
    // into limit()/offset() and surface as a 500, so fall back instead.
    const { searchParams } = new URL(request.url);
    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = parseInt(searchParams.get("limit") || "20", 10);
    const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;
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

    return successResponse({
      users: usersWithPermissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error getting users", error);
    return problemResponse(problems.internalError("Failed to retrieve users"));
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
      return problemResponse(auth.error!);
    }

    // Parse and validate request body
    const body = await request.json();

    const createUserSchema = z.object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be less than 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .transform((val) => val.toLowerCase()),
      email: z.email("Invalid email address").transform((val) => val.toLowerCase()),
      name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
      role: z.string().max(100, "Role must be less than 100 characters").default("user"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { username, email, name, role, password } = validationResult.data;

    // The requested role must exist (predefined or active custom role)
    // and must not outrank the creator. Before this check existed, any
    // holder of users:create could create an account directly as
    // superadmin — or with any arbitrary role string.
    const assignable = await checkRoleAssignable(auth.user!.id, role);

    if (!assignable.valid) {
      if (assignable.error === "INVALID_ROLE") {
        return problemResponse(problems.businessLogicError("Role does not exist or is not active"));
      }

      return problemResponse(
        problems.insufficientPermission("You cannot create a user with this role"),
      );
    }

    // Check if username or email already exists
    const existingUser = await db.query.user.findFirst({
      where: or(eq(user.username, username), eq(user.email, email)),
    });

    if (existingUser) {
      return problemResponse(problems.businessLogicError("Username or email already exists"));
    }

    // Create user
    const passwordHash = await hashPassword(password);

    let newUser;

    try {
      newUser = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(user)
          .values({
            username,
            email,
            name,
            role,
            passwordHash,
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

        await tx.insert(authLog).values({
          userId: created.id,
          eventType: "USER_CREATED",
          severity: "INFO",
          message: `User created with role ${role}`,
          ipAddress: resolveClientIp(request.headers),
          userAgent: request.headers.get("user-agent") || "unknown",
          metadata: { createdBy: auth.user!.id, role },
        });

        return created;
      });
    } catch (insertError) {
      // Unique-constraint race between the existence check above and the
      // insert. Postgres code 23505 = unique_violation.
      if ((insertError as { code?: string })?.code === "23505") {
        return problemResponse(problems.conflict("Username or email already exists"));
      }

      throw insertError;
    }

    return successResponse({ user: newUser });
  } catch (error) {
    logger.error("Error creating user", error);
    return problemResponse(problems.internalError("Failed to create user"));
  }
}
