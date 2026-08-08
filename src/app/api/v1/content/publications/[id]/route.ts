import { NextRequest } from "next/server";

import {
  handleContentDelete,
  handleContentRead,
  handleContentUpdate,
} from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/publications/[id] — Get publication
 * PATCH /api/v1/content/publications/[id] — Update publication
 * DELETE /api/v1/content/publications/[id] — Delete publication
 * Requires: content:read / content:update / content:delete
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleContentRead("publications", id);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleContentUpdate("publications", id, request);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleContentDelete("publications", id);
}
