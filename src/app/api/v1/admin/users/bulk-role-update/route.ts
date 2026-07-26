import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/rbac";
import { changeUserRole, getCurrentUser } from "@/lib/rbac";
import { problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/admin/users/bulk-role-update - Update multiple users' roles
 * Requires: users:update permission
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check
    const auth = await requirePermission("users:update");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const currentUser = auth.user!;

    // Parse and validate request body
    const body = await request.json();

    const bulkUpdateSchema = z.object({
      userIds: z
        .array(z.string())
        .min(1, "At least one user ID is required")
        .max(100, "Cannot update more than 100 users at once"),
      role: z.string().min(1, "Role is required"),
      reason: z.string().optional(),
      confirm: z
        .boolean()
        .refine((val) => val === true, "Confirmation is required for bulk operations"),
    });

    const validationResult = bulkUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { userIds, role, reason } = validationResult.data;

    // Check if current user ID is in the list (cannot update own role)
    if (userIds.includes(currentUser.id)) {
      return problemResponse(
        problems.businessLogicError("Cannot update your own role in bulk operations"),
      );
    }

    // Get request metadata for audit logging
    const requestHeaders = request.headers;
    const ipAddress =
      requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown";
    const userAgent = requestHeaders.get("user-agent") || "unknown";

    // Process bulk role updates
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        changeUserRole(userId, role, currentUser.id, reason, {
          ipAddress,
          userAgent,
        }),
      ),
    );

    // Count successes and failures
    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success,
    );
    const failed = results.filter(
      (result) =>
        result.status === "rejected" || (result.status === "fulfilled" && !result.value.success),
    );

    // Get detailed error information for failures
    const failures = results
      .map((result, index) => ({
        userId: userIds[index],
        success: result.status === "fulfilled" && result.value?.success,
        error:
          result.status === "rejected" ? "INTERNAL_ERROR" : result.value?.error || "UNKNOWN_ERROR",
      }))
      .filter((item) => !item.success);

    return successResponse(
      {
        total: userIds.length,
        successful: successful.length,
        failed: failed.length,
        failures,
        role,
        changedBy: currentUser.id,
        changedAt: new Date(),
      },
      {
        message: `Bulk role update completed. ${successful.length} successful, ${failed.length} failed.`,
      },
    );
  } catch (error) {
    logger.error("Error in bulk role update", error);
    return problemResponse(problems.internalError("Failed to process bulk role update"));
  }
}

/**
 * GET /api/v1/admin/users/bulk-role-update - Preview bulk role update
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
    const userIdsParam = searchParams.get("userIds");
    const newRole = searchParams.get("role");

    if (!userIdsParam || !newRole) {
      return problemResponse(
        problems.businessLogicError("userIds and role parameters are required"),
      );
    }

    const userIds = userIdsParam.split(",").filter((id) => id.trim());
    const { db } = await import("@/db/client");
    const { user } = await import("@/db/schema");
    const { inArray } = await import("drizzle-orm");

    // Get user information for preview
    const users = await db
      .select({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(inArray(user.id, userIds))
      .limit(100); // Limit preview to 100 users

    // Get current user info to check permissions
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return problemResponse(problems.authenticationRequired());
    }

    // Check if the current user can manage these roles
    const { canManageRole } = await import("@/types/role.types");
    const cannotManage = users.filter(
      (user) => !canManageRole(currentUser.role, user.role as any) || user.id === currentUser.id,
    );

    return successResponse({
      users,
      totalRequested: userIds.length,
      totalFound: users.length,
      cannotManage: cannotManage.length,
      newRole,
      canProceed: cannotManage.length === 0 && users.length > 0,
    });
  } catch (error) {
    logger.error("Error generating bulk role update preview", error);
    return problemResponse(problems.internalError("Failed to generate preview"));
  }
}
