import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { listEvents, listEventsQuerySchema } from "@/lib/services/event-read.service";

/**
 * Collects a repeatable query parameter, accepting both `?x=a&x=b` and
 * comma-separated `?x=a,b` forms. Returns undefined when absent so the
 * schema treats the filter as unset.
 */
function collectMulti(searchParams: URLSearchParams, key: string): string[] | undefined {
  const values = searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

/**
 * GET /api/v1/events - List events with filtering and pagination
 * Requires: events:read permission
 *
 * Filters: search (title/description/location), categoryId, status, type,
 * format, visibility (repeatable or comma-separated), startDate/endDate
 * (ISO bounds on start time), createdBy, isVirtual, tags, sortBy, sortOrder.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("events:read");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { searchParams } = new URL(request.url);

    const parsed = listEventsQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      status: collectMulti(searchParams, "status"),
      type: collectMulti(searchParams, "type"),
      format: collectMulti(searchParams, "format"),
      visibility: collectMulti(searchParams, "visibility"),
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      createdBy: searchParams.get("createdBy") ?? undefined,
      isVirtual: searchParams.get("isVirtual") ?? undefined,
      tags: collectMulti(searchParams, "tags"),
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
    });

    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const result = await listEvents(parsed.data);

    return successResponse(
      { events: result.events },
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    );
  } catch (error) {
    logger.error("Error listing events", error);
    return problemResponse(problems.internalError("Failed to list events"));
  }
}
