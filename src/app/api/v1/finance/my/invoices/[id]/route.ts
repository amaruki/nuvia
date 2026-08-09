/**
 * GET /api/v1/finance/my/invoices/[id] — one of the signed-in member's own
 * invoices, with line items (UI-34). Requires role user.
 *
 * A foreign or unknown id is the same 404 — member A never learns that
 * member B's invoice exists. Filtering is inside getMemberInvoice.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse } from "@/lib/http";
import { requireRole } from "@/lib/rbac";
import { getMemberInvoice } from "@/lib/services/finance";
import { problemFromMemberFinanceError } from "../../_lib";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireRole("user", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    const { id } = await params;
    const invoice = await getMemberInvoice(auth.user!.id, id);
    return successResponse({ invoice });
  } catch (error) {
    return problemResponse(problemFromMemberFinanceError(error, "Get my invoice"));
  }
}
