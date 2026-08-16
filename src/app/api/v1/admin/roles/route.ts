import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { resolveClientIp } from "@/lib/client-ip";
import { canGrantPermissions, requirePermission } from "@/lib/rbac";
import { getAllRoles, getRoleStatistics } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { db } from "@/db/client";
import { authLog, customRole } from "@/db/schema";
import { AVAILABLE_PERMISSIONS, isPredefinedRole } from "@/types/role";

/**
 * GET /api/v1/admin/roles - Get all roles with statistics
 * Requires: users:read permission
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const auth = await requirePermission("users:read");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";

    // Get all roles
    const roles = await getAllRoles();

    const data: {
      roles: typeof roles;
      statistics?: Awaited<ReturnType<typeof getRoleStatistics>>;
    } = { roles };

    // Include statistics if requested
    if (includeStats) {
      data.statistics = await getRoleStatistics();
    }

    return successResponse(data);
  } catch (error) {
    logger.error("Error getting roles", error);
    return problemResponse(problems.internalError("Failed to retrieve roles"));
  }
}

/**
 * POST /api/v1/admin/roles - Create a new custom role
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

    const createRoleSchema = z.object({
      name: z
        .string()
        .trim()
        .min(3, "Role name must be at least 3 characters")
        .max(100, "Role name must be less than 100 characters")
        .regex(
          /^[a-z][a-z0-9_-]*$/,
          "Role name must start with a letter and contain only lowercase letters, numbers, underscores, and hyphens",
        ),
      description: z.string().max(500, "Description must be less than 500 characters").optional(),
      permissions: z
        .array(z.enum(AVAILABLE_PERMISSIONS))
        .min(1, "At least one permission is required")
        .refine(
          (permissions) => new Set(permissions).size === permissions.length,
          "Permissions must not contain duplicates",
        ),
    });

    const validationResult = createRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { name, description, permissions } = validationResult.data;

    // A custom role may not shadow a predefined role name. The session
    // resolves predefined roles first, so a shadowing row would be dead
    // data that still shows up in role pickers.
    if (isPredefinedRole(name)) {
      return problemResponse(
        problems.conflict(`"${name}" is a predefined role and cannot be redefined`),
      );
    }

    // A role may only carry permissions its creator already holds.
    // Before this check existed, any holder of users:create could mint a
    // role granting system:* or users:manage — permissions they did not
    // have — and then assign it.
    if (!canGrantPermissions(auth.user!.role, auth.user!.permissions ?? [], permissions)) {
      return problemResponse(
        problems.insufficientPermission(
          "You cannot create a role carrying permissions you do not hold",
        ),
      );
    }

    const existing = await db.query.customRole.findFirst({
      where: eq(customRole.name, name),
    });

    if (existing) {
      return problemResponse(
        problem("conflict", 409, "Conflict", `A role named "${name}" already exists`),
      );
    }

    let newRole;

    try {
      [newRole] = await db
        .insert(customRole)
        .values({ name, description, permissions, isSystem: false })
        .returning();
    } catch (insertError) {
      // Unique-constraint race between the existence check and the insert.
      if ((insertError as { code?: string })?.code === "23505") {
        return problemResponse(
          problem("conflict", 409, "Conflict", `A role named "${name}" already exists`),
        );
      }

      throw insertError;
    }

    await db.insert(authLog).values({
      userId: auth.user!.id,
      eventType: "ROLE_CREATED",
      severity: "INFO",
      message: `Custom role "${name}" created with ${permissions.length} permission(s)`,
      // Issue #3: trusted-hop resolution (raw leftmost XFF read was the bug).
      ipAddress: resolveClientIp(request.headers),
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        roleName: name,
        permissions,
      },
    });

    return successResponse({ role: newRole });
  } catch (error) {
    logger.error("Error creating role", error);
    return problemResponse(problems.internalError("Failed to create role"));
  }
}
