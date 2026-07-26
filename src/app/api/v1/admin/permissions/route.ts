import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, problems, successResponse } from "@/lib/http";
import { AVAILABLE_PERMISSIONS, PERMISSION_CATEGORIES, formatPermission } from "@/types/role.types";

/**
 * GET /api/v1/admin/permissions - Get all available permissions
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
    const groupBy = (searchParams.get("groupBy") as "module" | "category" | "flat") || "category";

    // Format permissions based on grouping preference
    let permissions: any;

    switch (groupBy) {
      case "module":
        permissions = groupPermissionsByModule();
        break;
      case "category":
        permissions = groupPermissionsByCategory();
        break;
      case "flat":
      default:
        permissions = AVAILABLE_PERMISSIONS.map((permission) => ({
          id: permission,
          name: formatPermission(permission),
          module: permission.split(":")[0],
          action: permission.split(":")[1],
        }));
        break;
    }

    return successResponse({
      permissions,
      categories: Object.entries(PERMISSION_CATEGORIES).map(([key, value]) => ({
        module: key,
        ...value,
      })),
    });
  } catch (error) {
    console.error("Error getting permissions:", error);
    return problemResponse(problems.internalError("Failed to retrieve permissions"));
  }
}

/**
 * Group permissions by module (e.g., users, events, etc.)
 */
function groupPermissionsByModule() {
  const grouped: Record<
    string,
    Array<{
      id: string;
      name: string;
      action: string;
    }>
  > = {};

  AVAILABLE_PERMISSIONS.forEach((permission) => {
    const [module, action] = permission.split(":");

    if (!grouped[module]) {
      grouped[module] = [];
    }

    grouped[module].push({
      id: permission,
      name: formatPermission(permission),
      action: action.charAt(0).toUpperCase() + action.slice(1),
    });
  });

  return Object.entries(grouped).map(([module, permissions]) => ({
    module,
    category: PERMISSION_CATEGORIES[module as keyof typeof PERMISSION_CATEGORIES],
    permissions,
  }));
}

/**
 * Group permissions by category for UI organization
 */
function groupPermissionsByCategory() {
  const grouped: Record<
    string,
    {
      name: string;
      description: string;
      icon: string;
      color: string;
      permissions: Array<{
        id: string;
        name: string;
        action: string;
      }>;
    }
  > = {};

  AVAILABLE_PERMISSIONS.forEach((permission) => {
    const [module, action] = permission.split(":");
    const category = PERMISSION_CATEGORIES[module as keyof typeof PERMISSION_CATEGORIES];

    if (!grouped[module]) {
      grouped[module] = {
        name: category?.name || module,
        description: category?.description || `Manage ${module}`,
        icon: category?.icon || "settings",
        color: category?.color || "gray",
        permissions: [],
      };
    }

    grouped[module].permissions.push({
      id: permission,
      name: formatPermission(permission),
      action: action.charAt(0).toUpperCase() + action.slice(1),
    });
  });

  return Object.values(grouped);
}
