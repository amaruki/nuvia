import { NextRequest } from "next/server";

import { handleContentCreate, handleContentList } from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/publications — List publications (paginated, filterable)
 * POST /api/v1/content/publications — Create publication
 * Requires: content:read / content:create
 */
export async function GET(request: NextRequest) {
  return handleContentList("publications", request);
}

export async function POST(request: NextRequest) {
  return handleContentCreate("publications", request);
}
