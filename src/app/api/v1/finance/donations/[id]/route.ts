/**
 * GET   /api/v1/finance/donations/:id — one donation. Requires finance:read.
 * PATCH /api/v1/finance/donations/:id — update the mutable fields
 *        (status/notes/receiptSent/campaign). Requires finance:update.
 *
 * Donor identity, amount, currency and donation date are immutable once
 * recorded — the update schema refuses them rather than rewriting money
 * history.
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { getDonation, updateDonation } from "@/lib/services/donation.service";
import { donationUpdateSchema } from "@/lib/validation/donation.validation";
import { problemFromFinanceError } from "../../_lib/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const donation = await getDonation(id);
    return successResponse({ donation });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Get donation error"));
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

    const parsed = donationUpdateSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const donation = await updateDonation(id, parsed.data);
    return successResponse({ donation });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Update donation error"));
  }
}
