import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { markNoShowRegistration } from "@/lib/services/registration.service";
import { handleEventRoute } from "../../../../_lib";

/** Admin no-show: marks a CONFIRMED registration as NO_SHOW (issue #17). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> },
) {
  return handleEventRoute(async () => {
    const auth = await requirePermission("events:manage", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id, registrationId } = await params;

    const result = await markNoShowRegistration(id, registrationId);
    logger.info("event registration marked as no-show", { eventId: id, registrationId });

    return successResponse(result.registration, { event: result.event });
  }, "POST /api/v1/events/[id]/registrations/[registrationId]/no-show");
}
