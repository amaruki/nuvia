/**
 * GET  /api/v1/finance/tiers — list membership tiers. Requires finance:read.
 *        `?includeInactive=true` also returns deactivated tiers.
 * POST /api/v1/finance/tiers — create a tier. Requires finance:create.
 *
 * Amounts are numeric(10,2) string mode; the schema accepts string decimals
 * only (ADR-0015).
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { createTier, listTiers } from "@/lib/services/membership-tier.service";
import { createTierSchema } from "@/lib/validation/finance.validation";
import { problemFromFinanceError } from "../_lib/helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "true";
    const tiers = await listTiers({ includeInactive });

    return successResponse({ tiers, total: tiers.length });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List tiers error"));
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:create");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = createTierSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const tier = await createTier(parsed.data);
    return successResponse({ tier }, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Create tier error"));
  }
}
