/**
 * GET /api/v1/dashboard/overview — the live aggregates behind the dashboard
 * overview widgets (UI-01): member counts (ADR-0014 derived status), event
 * counts, and the finance overview (ADR-0015 string money).
 *
 * Sections are permission-gated: a section the caller cannot read comes
 * back null so the widget renders its empty state instead of fabricated
 * numbers. A caller with none of the permissions still gets a 200 with all
 * sections null — authentication is the only hard gate.
 */

import type { NextRequest } from "next/server";

import { problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { hasPermission, requireRole } from "@/lib/rbac";
import {
  getEventOverviewStats,
  getFinanceOverviewStats,
  getMemberOverviewStats,
} from "@/lib/services/dashboard-overview.service";

export async function GET(request: NextRequest) {
  try {
    // Any signed-in account may read its own dashboard overview; sections
    // the caller lacks permission for come back null below.
    const auth = await requireRole("user", request.headers);
    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const [canReadMembers, canReadEvents, canReadFinance] = await Promise.all([
      hasPermission("memberships:read"),
      hasPermission("events:read"),
      hasPermission("finance:read"),
    ]);

    // Skip aggregates the caller cannot see anyway.
    const [members, events, finance] = await Promise.all([
      canReadMembers ? getMemberOverviewStats() : Promise.resolve(null),
      canReadEvents ? getEventOverviewStats() : Promise.resolve(null),
      canReadFinance ? getFinanceOverviewStats() : Promise.resolve(null),
    ]);

    return successResponse({ overview: { members, events, finance } });
  } catch (error) {
    logger.error("Dashboard overview error", error);
    return problemResponse(problems.internalError("An unexpected error occurred"));
  }
}
