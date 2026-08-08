import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/rbac";
import { changeUserRole } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/v1/admin/users/[id]/role - Update user role
 * Requires: users:update permission
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params;
  try {
    // Authorization check
    const auth = await requirePermission("users:update");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const currentUser = auth.user!;

    // Cannot change your own role
    if (targetUserId === currentUser.id) {
      return problemResponse(problems.businessLogicError("Cannot change your own role"));
    }

    // Parse and validate request body
    const body = await request.json();

    const updateRoleSchema = z.object({
      role: z.string().min(1, "Role is required").max(100, "Role must be less than 100 characters"),
      reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
    });

    const validationResult = updateRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { role, reason } = validationResult.data;

    // Get request metadata for audit logging
    const requestHeaders = request.headers;
    const ipAddress =
      requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown";
    const userAgent = requestHeaders.get("user-agent") || "unknown";

    // Change user role
    const result = await changeUserRole(targetUserId, role, currentUser.id, reason, {
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      const errorMap: Record<string, { status: number; title: string; message: string }> = {
        INSUFFICIENT_PERMISSIONS: {
          status: 403,
          title: "Insufficient permission",
          message: "You do not have permission to manage this user's role",
        },
        USER_NOT_FOUND: { status: 404, title: "Not found", message: "User not found" },
        INVALID_ROLE: {
          status: 422,
          title: "Invalid role",
          message: "Role does not exist or is not active",
        },
        ROLE_NOT_ASSIGNABLE: {
          status: 403,
          title: "Role not assignable",
          message: "You do not have sufficient privilege to assign this role",
        },
        LAST_SUPERADMIN: {
          status: 409,
          title: "Last super admin",
          message: "Cannot change the only super admin's role — the system would be locked out",
        },
        INTERNAL_ERROR: {
          status: 500,
          title: "Internal server error",
          message: "An unexpected error occurred",
        },
      };

      const error = errorMap[result.error || "INTERNAL_ERROR"] || errorMap["INTERNAL_ERROR"];

      return problemResponse(
        problem("role-change-failed", error.status, error.title, error.message, {
          errors: [{ field: "role", message: error.message }],
        }),
      );
    }

    return successResponse({
      userId: targetUserId,
      newRole: role,
      changedBy: currentUser.id,
      changedAt: new Date(),
    });
  } catch (error) {
    logger.error("Error updating user role", error);
    return problemResponse(problems.internalError("Failed to update user role"));
  }
}

/**
 * GET /api/v1/admin/users/[id]/role - Get user's current role and permissions
 * Requires: users:read permission
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params;
  try {
    // Authorization check
    const auth = await requirePermission("users:read");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    // Get user permissions
    const { getUserPermissions } = await import("@/lib/rbac");
    const userPermissions = await getUserPermissions(targetUserId);

    // Get user basic info
    const { db } = await import("@/db/client");
    const { user: userTable } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const targetUser = await db.query.user.findFirst({
      where: eq(userTable.id, targetUserId),
      columns: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return problemResponse(problems.notFound("User not found"));
    }

    return successResponse({
      user: {
        ...targetUser,
        permissions: userPermissions.permissions,
      },
    });
  } catch (error) {
    logger.error("Error getting user role", error);
    return problemResponse(problems.internalError("Failed to retrieve user role"));
  }
}
