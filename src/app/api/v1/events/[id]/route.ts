import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { getEventDetail } from "@/lib/services/event-read.service";
import { deleteEvent, updateEvent, updateEventSchema } from "@/lib/services/event-write";
import { handleEventRoute } from "../_lib";

/**
 * GET /api/v1/events/[id] - Get a single event with detail-view context:
 * category, viewer registration state, organizer's other events, and
 * similar events.
 * Requires: events:read permission
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission("events:read", request.headers);

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

/**
 * PATCH /api/v1/events/[id] - Partial update of an event
 * Requires: events:update permission
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleEventRoute(async () => {
    const auth = await requirePermission("events:update", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem("validation-error", 422, "Validation failed", "Request body must be valid JSON"),
      );
    }

    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const dto = await updateEvent(id, parsed.data);
    logger.info("event updated", { eventId: id, actor: auth.user!.id });

    return successResponse(dto);
  }, "PATCH /api/v1/events/[id]");
}

/**
 * DELETE /api/v1/events/[id] - Delete an event (registrations, speakers,
 * sponsors and sessions cascade via FK)
 * Requires: events:delete permission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleEventRoute(async () => {
    const auth = await requirePermission("events:delete", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;

    await deleteEvent(id);
    logger.info("event deleted", { eventId: id, actor: auth.user!.id });

    return successResponse({ id, deleted: true });
  }, "DELETE /api/v1/events/[id]");
}
