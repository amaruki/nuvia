import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/rbac";
import { getAllRoles, getRoleStatistics } from "@/lib/rbac";
import { problemResponse, problems, successResponse, validationProblem } from "@/lib/http";

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
    console.error("Error getting roles:", error);
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
        .min(1, "Role name is required")
        .max(100, "Role name must be less than 100 characters"),
      description: z.string().optional(),
      permissions: z.array(z.string()).min(1, "At least one permission is required"),
    });

    const validationResult = createRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return problemResponse(validationProblem(validationResult.error));
    }

    const { name, description, permissions } = validationResult.data;

    // TODO: Implement custom role creation in database
    // For now, return a placeholder response
    const newRole = {
      id: `custom_${Date.now()}`,
      name,
      description,
      permissions,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return successResponse({ role: newRole });
  } catch (error) {
    console.error("Error creating role:", error);
    return problemResponse(problems.internalError("Failed to create role"));
  }
}
