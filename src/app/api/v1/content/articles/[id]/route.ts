import { NextRequest } from "next/server";

import {
  handleContentDelete,
  handleContentRead,
  handleContentUpdate,
} from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/articles/[id] — Get article
 * PATCH /api/v1/content/articles/[id] — Update article
 * DELETE /api/v1/content/articles/[id] — Delete article
 * Requires: content:read / content:update / content:delete
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleContentRead("articles", id);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleContentUpdate("articles", id, request);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleContentDelete("articles", id);
}
