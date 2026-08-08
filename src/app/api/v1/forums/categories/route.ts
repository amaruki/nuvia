import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  createCategory,
  createCategorySchema,
  forumProblemFromError,
  listCategories,
} from "@/lib/services/forum";

/**
 * GET /api/v1/forums/categories - List forum categories with post stats
 * Requires: forum:read permission
 */
export async function GET() {
  try {
    const auth = await requirePermission("forum:read");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const categories = await listCategories();
    return NextResponse.json(successResponse(categories));
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}

/**
 * POST /api/v1/forums/categories - Create a forum category
 * Requires: forum:manage permission
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("forum:manage");
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const body = await request.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const category = await createCategory(parsed.data, auth.user!);
    return NextResponse.json(successResponse(category), { status: 201 });
  } catch (error) {
    return problemResponse(forumProblemFromError(error));
  }
}
