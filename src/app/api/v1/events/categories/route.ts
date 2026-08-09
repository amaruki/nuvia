/**
 * GET  /api/v1/events/categories — reference data for the event form's
 *        category select. Requires events:read.
 * POST /api/v1/events/categories — create a category so a fresh install
 *        (empty event_categories table) can actually create events.
 *        Requires events:manage; duplicate names return 409.
 *
 * events.category_id is NOT NULL on the events table and the create-event
 * schema demands a resolvable category, so without this reference endpoint
 * the wired create form would be permanently dead on an empty database.
 */

import type { NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { eventCategory } from "@/db/schema";
import { problem, problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { logger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac";

const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be at most 100 characters"),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(200, "Display name must be at most 200 characters"),
  description: z.string().trim().max(500).optional(),
  color: z.string().trim().max(50).nullish(),
  icon: z.string().trim().max(50).nullish(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

/** Walk the driver error chain for a postgres error code (drizzle wraps). */
function pgErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("events:read", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    const categories = await db.query.eventCategory.findMany({
      orderBy: [asc(eventCategory.sortOrder), asc(eventCategory.name)],
    });

    return successResponse({ categories, total: categories.length });
  } catch (error) {
    logger.error("Error listing event categories", error);
    return problemResponse(problems.internalError("Failed to list event categories"));
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission("events:manage", request.headers);
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(problem("invalid-json", 400, "Invalid JSON body"));
    }

    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    try {
      const [category] = await db
        .insert(eventCategory)
        .values({
          name: parsed.data.name,
          displayName: parsed.data.displayName,
          description: parsed.data.description ?? null,
          color: parsed.data.color ?? null,
          icon: parsed.data.icon ?? null,
          sortOrder: parsed.data.sortOrder ?? 0,
        })
        .returning();

      logger.info("event category created", {
        categoryId: category.id,
        actor: auth.user!.id,
      });
      return successResponse(category, undefined, { status: 201 });
    } catch (error) {
      if (pgErrorCode(error) === "23505") {
        return problemResponse(
          problems.conflict(`A category named "${parsed.data.name}" already exists`),
        );
      }
      throw error;
    }
  } catch (error) {
    logger.error("Error creating event category", error);
    return problemResponse(problems.internalError("Failed to create event category"));
  }
}
