/**
 * GET   /api/v1/learning/certificates/[id] — fetch one certificate
 * PATCH /api/v1/learning/certificates/[id] — update a certificate (revoke/restore)
 */

import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import {
  getCertificate,
  updateCertificate,
  updateCertificateSchema,
} from "@/lib/services/learning";
import { handleLearningRoute } from "../../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return handleLearningRoute(async () => {
    const auth = await requirePermission("learning:read", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const { id } = await params;
    const found = await getCertificate(id);
    if (!found) {
      return problemResponse(problems.notFound("Certificate not found"));
    }
    return successResponse(found);
  }, "GET /api/v1/learning/certificates/[id]");
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return handleLearningRoute(async () => {
    const auth = await requirePermission("learning:update", request.headers);
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

    const parsed = updateCertificateSchema.safeParse(body);
    if (!parsed.success) {
      return problemResponse(validationProblem(parsed.error));
    }

    const updated = await updateCertificate(id, parsed.data);
    return successResponse(updated);
  }, "PATCH /api/v1/learning/certificates/[id]");
}
