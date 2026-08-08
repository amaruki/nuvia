import { NextRequest } from "next/server";

import {
  handleCategoryDelete,
  handleCategoryRead,
  handleCategoryUpdate,
} from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/categories/[id] — Get category
 * PATCH /api/v1/content/categories/[id] — Update category
 * DELETE /api/v1/content/categories/[id] — Delete category
 * Requires: content:read / content:update / content:delete
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleCategoryRead(id);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleCategoryUpdate(id, request);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleCategoryDelete(id);
}
