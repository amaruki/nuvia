/**
 * GET  /api/v1/finance/donations — list donations, newest first.
 *        Requires finance:read. Filters: status. Pagination: page
 *        (1-based) + limit (max 100), conventions-doc meta.
 * POST /api/v1/finance/donations — record a donation. Requires
 *        finance:create.
 *
 * Amounts are numeric(10,2) string mode (ADR-0015 §5).
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { createDonation, listDonations } from "@/lib/services/donation.service";
import {
  donationCreateSchema,
  donationListQuerySchema,
} from "@/lib/validation/donation.validation";
import { problemFromFinanceError } from "../_lib/helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = donationListQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const { donations, total } = await listDonations(parsed.data);
    return successResponse({
      donations,
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / parsed.data.limit)),
      },
    });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "List donations error"));
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

    const parsed = donationCreateSchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const donation = await createDonation(parsed.data);
    return successResponse({ donation }, undefined, { status: 201 });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Create donation error"));
  }
}
