import { NextRequest } from "next/server";

import { handleContentCreate, handleContentList } from "@/app/api/v1/content/shared";

/**
 * GET /api/v1/content/articles — List articles (paginated, filterable)
 * POST /api/v1/content/articles — Create article
 * Requires: content:read / content:create
 */
export async function GET(request: NextRequest) {
  return handleContentList("articles", request);
}

export async function POST(request: NextRequest) {
  return handleContentCreate("articles", request);
}
