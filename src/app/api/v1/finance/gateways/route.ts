/**
 * GET /api/v1/finance/gateways — the deployment's configured payment
 * gateway (C4). Requires finance:read.
 *
 * Exactly one gateway exists and it is managed by deployment config
 * (PAYMENT_GATEWAY env, docs/adr/0015), not dashboard CRUD. The response
 * exposes provider, status and credential *presence* only — never values.
 */

import { problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { describeConfiguredGateway } from "@/lib/services/finance-report.service";
import { problemFromFinanceError } from "../_lib/helpers";

export async function GET() {
  try {
    const auth = await requirePermission("finance:read");
    if (!auth.success) return problemResponse(auth.error!);

    const gateway = describeConfiguredGateway();
    return successResponse({ gateway });
  } catch (error) {
    return problemResponse(problemFromFinanceError(error, "Describe gateway error"));
  }
}
