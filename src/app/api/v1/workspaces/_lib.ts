/**
 * Shared helpers for the /api/v1/workspaces route handlers.
 */

import type { NextResponse } from "next/server";
import { problemResponse, problems } from "@/lib/http";
import { logger } from "@/lib/logger";
import { WorkspaceServiceError } from "@/lib/services/workspace.service";

/** Maps WorkspaceServiceError to its RFC 9457 response; anything else is a 500. */
export async function handleWorkspaceRoute(
  handler: () => Promise<NextResponse>,
  context: string,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof WorkspaceServiceError) {
      return problemResponse(error.problemDetails);
    }
    logger.error(`Unhandled error in ${context}`, error);
    return problemResponse(problems.internalError());
  }
}

/** Reads ?page=&limit= with sane bounds (defaults page=1, limit=20). */
export function parsePagination(searchParams: URLSearchParams): { page?: number; limit?: number } {
  const page = Number.parseInt(searchParams.get("page") ?? "", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  return {
    page: Number.isFinite(page) && page > 0 ? page : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  };
}
