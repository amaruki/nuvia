import { NextRequest } from "next/server";

import { handleCategoryCreate, handleCategoryList } from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/categories — List content categories (paginated)
 * POST /api/v1/content/categories — Create category
 * Requires: content:read / content:create
 */
export async function GET(request: NextRequest) {
  return handleCategoryList(request);
}

export async function POST(request: NextRequest) {
  return handleCategoryCreate(request);
}
