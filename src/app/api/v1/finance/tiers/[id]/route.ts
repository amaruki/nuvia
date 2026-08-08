/**
 * GET    /api/v1/finance/tiers/[id] — read one tier. Requires finance:read.
 * PATCH  /api/v1/finance/tiers/[id] — update a tier. Requires finance:update.
 * DELETE /api/v1/finance/tiers/[id] — delete a tier. Requires finance:delete.
 *
 * Delete is refused while subscriptions or transactions still reference the
 * tier (409) — deactivate it via PATCH `isActive: false` instead.
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { deleteTier, getTier, updateTier } from "@/lib/services/membership-tier.service";
import { updateTierSchema } from "@/lib/validation/finance.validation";
import { problemFromFinanceError } from "../../_lib/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const tier = await getTier(id);
    return successResponse({ tier });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Get tier error"));
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:update");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = updateTierSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const tier = await updateTier(id, parsed.data);
    return successResponse({ tier });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Update tier error"));
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:delete");
    if (!auth.success) return problemResponse(auth.error!);

    await deleteTier(id);
    return successResponse({ deleted: true, id });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Delete tier error"));
  }
}
