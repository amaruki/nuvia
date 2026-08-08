/**
 * Write-path helpers — category resolution and slug generation.
 */

import { eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventCategory } from "@/db/schema";
import { problem } from "@/lib/http";
import { EventWriteError } from "./errors";

/** Resolves a category reference (id first, then unique name) to its row. */
export async function resolveCategory(reference: string): Promise<{ id: string } | null> {
  const byId = await db
    .select({ id: eventCategory.id })
    .from(eventCategory)
    .where(eq(eventCategory.id, reference))
    .limit(1);
  if (byId.length > 0) return byId[0];

  const [byName] = await db
    .select({ id: eventCategory.id })
    .from(eventCategory)
    .where(or(eq(eventCategory.name, reference), ilike(eventCategory.name, reference)))
    .limit(1);
  return byName ?? null;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180) || "event"
  );
}

/** Generates a unique slug from the title, appending -2, -3, … on collision. */
export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  const candidates = [base, ...Array.from({ length: 24 }, (_, index) => `${base}-${index + 2}`)];
  // One round-trip for every candidate instead of one query per attempt; the
  // unique index stays the source of truth for the callers' conflict handling.
  const rows = await db
    .select({ slug: event.slug })
    .from(event)
    .where(inArray(event.slug, candidates));
  const taken = new Set(rows.map((row) => row.slug));
  const available = candidates.find((candidate) => !taken.has(candidate));
  if (available) return available;
  throw new EventWriteError(
    problem("conflict", 409, "Conflict", `Could not derive a unique slug from "${title}"`),
  );
}
