/**
 * POST /api/v1/content/sweep — run the scheduled-content publisher on
 * demand (editor action). Requires content:publish.
 *
 * The same logic runs headless from scripts/sweep-scheduled-content.ts on
 * a schedule (issue #17); this route exists so an editor can trigger it
 * without shell access and see exactly what was promoted. Idempotent: rows
 * a concurrent action already moved are skipped, not failed.
 */

import type { NextRequest } from "next/server";
import { problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { sweepScheduledContent } from "@/lib/services/content";

export async function POST(_request: NextRequest) {
  const auth = await requirePermission("content:publish");
  if (!auth.success) return problemResponse(auth.error!);

  const result = await sweepScheduledContent();
  return successResponse(result);
}
