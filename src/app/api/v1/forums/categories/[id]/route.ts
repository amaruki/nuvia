import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  deleteCategory,
  forumProblemFromError,
  getCategory,
  updateCategory,
  updateCategorySchema,
} from "@/lib/services/forum";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/forums/categories/:id - Get one category with stats
 * Requires: forum:read permission
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const category = await getCategory(id);
    return NextResponse.json(successResponse(category));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * PATCH /api/v1/forums/categories/:id - Update a category
 * Requires: forum:manage permission
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:manage");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const category = await updateCategory(id, parsed.data, auth.user!);
    return NextResponse.json(successResponse(category));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * DELETE /api/v1/forums/categories/:id - Delete an empty category
 * Requires: forum:manage permission
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requirePermission("forum:manage");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await context.params;
    await deleteCategory(id, auth.user!);
    return NextResponse.json(successResponse({ id, deleted: true }));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
