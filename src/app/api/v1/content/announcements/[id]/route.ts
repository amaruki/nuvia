import { NextRequest } from "next/server";

import {
  handleContentDelete,
  handleContentRead,
  handleContentUpdate,
} from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/announcements/[id] — Get announcement
 * PATCH /api/v1/content/announcements/[id] — Update announcement
 * DELETE /api/v1/content/announcements/[id] — Delete announcement
 * Requires: content:read / content:update / content:delete
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleContentRead("announcements", id);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleContentUpdate("announcements", id, request);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleContentDelete("announcements", id);
}
