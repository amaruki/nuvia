import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac";
import { handleEventRoute } from "../../_lib";
import { selfCheckIn } from "@/lib/services/event-self-check-in.service";

/**
 * POST /api/v1/events/[id]/self-check-in — member self check-in (UI-24 item 5).
 *
 * Requires only the session of the registered member (events:read): the
 * service verifies the session user owns the registration, compares the
 * submitted QR credential against event_registrations.qr_code, and enforces
 * the check-in window derived from the event schedule. Staff check-in
 * (events:manage) lives on a separate route and is untouched.
 */

const selfCheckInBodySchema = z.object({
  qrCode: z.string().min(8).max(512),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return handleEventRoute(async () => {
    const auth = await requirePermission("events:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const parseResult = selfCheckInBodySchema.safeParse(await request.json().catch(() => null));
    if (!parseResult.success) {
      return problemResponse(validationProblem(parseResult.error));
    }

    const result = await selfCheckIn(id, auth.user!.id, parseResult.data.qrCode);
    logger.info("event self check-in recorded", {
      eventId: id,
      userId: auth.user!.id,
      registrationId: result.registrationId,
    });
    return successResponse(result);
  }, "POST /api/v1/events/[id]/self-check-in");
}
