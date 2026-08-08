import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { getEventDetail } from "@/lib/services/event-read.service";

/**
 * GET /api/v1/events/[id] - Get a single event with detail-view context:
 * category, viewer registration state, organizer's other events, and
 * similar events.
 * Requires: events:read permission
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission("events:read");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;

    const detail = await getEventDetail(id, auth.user?.id);

    if (!detail) {
      return problemResponse(problems.notFound(`Event ${id} not found`));
    }

    return successResponse(detail);
  } catch (error) {
    logger.error("Error fetching event", error);
    return problemResponse(problems.internalError("Failed to fetch event"));
  }
}
