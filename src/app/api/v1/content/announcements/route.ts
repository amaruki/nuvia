import { NextRequest } from "next/server";

import { handleContentCreate, handleContentList } from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/announcements — List announcements (paginated, filterable)
 * POST /api/v1/content/announcements — Create announcement
 * Requires: content:read / content:create
 */
export async function GET(request: NextRequest) {
  return handleContentList("announcements", request);
}

export async function POST(request: NextRequest) {
  return handleContentCreate("announcements", request);
}
