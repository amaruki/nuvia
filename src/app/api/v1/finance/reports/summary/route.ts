/**
 * GET /api/v1/finance/reports/summary — computed finance aggregates for the
 * reports dashboard (C4). Requires finance:read.
 *
 * Everything is derived live from membership_transactions + membership_invoices;
 * nothing is stored. `months` (1-36, default 12) sets the revenue window.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { problemResponse, successResponse, validationProblem } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { getFinanceReportSummary } from "@/lib/services/finance-report.service";
import { problemFromFinanceError } from "../../_lib/helpers";

const summaryQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(36).default(12),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = summaryQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const summary = await getFinanceReportSummary({ months: parsed.data.months });
    return successResponse({ summary });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Finance report summary error"));
  }
}
