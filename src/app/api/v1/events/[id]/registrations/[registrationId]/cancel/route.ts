import { NextRequest } from "next/server";
import { hasPermission, requirePermission } from "@/lib/rbac";
import { problemResponse, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { cancelRegistration } from "@/lib/services/registration.service";
import { handleEventRoute } from "../../../../_lib";

/**
 * Cancels a registration. Owners may cancel their own registration;
 * events:manage holders may cancel any registration on the event.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> },
) {
  return handleEventRoute(async () => {
    const auth = await requirePermission("events:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id, registrationId } = await params;

    const canManage = await hasPermission("events:manage", request.headers);
    const result = await cancelRegistration(id, registrationId, {
      userId: auth.user!.id,
      canManage,
    });

    logger.info("event registration canceled", {
      eventId: id,
      registrationId,
      actor: auth.user!.id,
      promoted: result.promoted?.id ?? null,
    });

    return successResponse({ registration: result.registration, promoted: result.promoted });
  }, "POST /api/v1/events/[id]/registrations/[registrationId]/cancel");
}
