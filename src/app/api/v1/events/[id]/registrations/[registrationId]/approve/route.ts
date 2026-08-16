import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { approveRegistration } from "@/lib/services/registration.service";
import { handleEventRoute } from "../../../../_lib";

/** Admin approval (issue #16): moves a PENDING registration to CONFIRMED. */
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

    const result = await approveRegistration(id, registrationId);
    logger.info("event registration approved", { eventId: id, registrationId });

    return successResponse(result.registration, { event: result.event });
  }, "POST /api/v1/events/[id]/registrations/[registrationId]/approve");
}
