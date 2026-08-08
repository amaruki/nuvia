import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import {
  createRegistration,
  createRegistrationSchema,
  listRegistrations,
  listRegistrationsQuerySchema,
} from "@/lib/services/registration.service";
import { handleEventRoute } from "../../_lib";

/** Admin list of an event's registrations (requires events:manage). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleEventRoute(async () => {
    const auth = await requirePermission("events:manage", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.getAll("status").flatMap((value) => value.split(","));
    const parsed = listRegistrationsQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: status.length ? status : undefined,
      search: searchParams.get("search") ?? undefined,
    });
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const result = await listRegistrations(id, parsed.data);

    return successResponse(result.registrations, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  }, "GET /api/v1/events/[id]/registrations");
}

/** Self-registration for the authenticated member (user id comes from the session, never the body). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleEventRoute(async () => {
    const auth = await requirePermission("events:read", request.headers);
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

    const parsed = createRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const result = await createRegistration(id, auth.user!.id, parsed.data);
    logger.info("event registration created", {
      eventId: id,
      userId: auth.user!.id,
      status: result.registration.status,
    });

    return successResponse(result.registration, { event: result.event }, { status: 201 });
  }, "POST /api/v1/events/[id]/registrations");
}
