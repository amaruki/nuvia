import { NextRequest } from "next/server";
import { z } from "zod";
import { hasPermission, requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { cancelRegistration } from "@/lib/services/registration.service";
import { handleEventRoute } from "../../../../_lib";

const cancelBodySchema = z.object({
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
});

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

    // Optional admin reason: `{ "reason": "..." }`. An absent/empty body is
    // fine for owner self-cancellations, which carry no reason.
    let reason: string | undefined;
    const rawBody = await request.text();
    if (rawBody.trim()) {
      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
      }
      const parsed = cancelBodySchema.safeParse(parsedBody);
      if (!parsed.success) {
        return problemResponse(
          problem("validation-error", 400, "Validation error", parsed.error.issues[0]?.message),
        );
      }
      reason = parsed.data.reason;
    }

    const canManage = await hasPermission("events:manage", request.headers);
    const result = await cancelRegistration(
      id,
      registrationId,
      {
        userId: auth.user!.id,
        canManage,
      },
      reason,
    );

    logger.info("event registration canceled", {
      eventId: id,
      registrationId,
      actor: auth.user!.id,
      reason: reason ?? null,
      promoted: result.promoted?.id ?? null,
    });

    return successResponse({ registration: result.registration, promoted: result.promoted });
  }, "POST /api/v1/events/[id]/registrations/[registrationId]/cancel");
}
