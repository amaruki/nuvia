/**
 * Organization singleton service (ADR-0007).
 *
 * The `organizations` table holds exactly one row (id = "default") per
 * deployment: the association's identity, branding, locale, currency, and
 * timezone. Nothing read this row until now — email templates, currency
 * formatting, and branding all hardcoded strings instead.
 *
 * Reads go through `getOrganization()`, which upserts the default row on
 * first read so a fresh deployment has sane values without a seed step.
 * A process-local cache keeps hot paths (email rendering, branding) cheap;
 * `updateOrganization()` invalidates it. Multi-process deployments can see
 * a stale row in other processes until restart — acceptable for settings
 * that change rarely; the cache is a read optimization, not a source of
 * truth.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organization, type Organization } from "@/db/schema";
import { DatabaseError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { OrganizationUpdateInput } from "@/lib/validation/organization.validation";

export const ORGANIZATION_ID = "default";

/** Sane defaults for a fresh deployment (schema defaults mirror these). */
export const ORGANIZATION_DEFAULTS = {
  name: "Nuvia",
  legalName: null,
  logo: null,
  website: null,
  supportEmail: null,
  locale: "en",
  currency: "USD",
  timezone: "UTC",
  settings: {},
} as const;

let cache: Organization | null = null;

/** Drops the process-local cache; the next read hits the database. */
export function invalidateOrganizationCache(): void {
  cache = null;
}

/**
 * Returns the singleton organization row, creating it with defaults on
 * first read (upsert-on-read). Concurrent first-reads are safe: the insert
 * uses ON CONFLICT DO NOTHING and the loser re-reads the winner's row.
 */
export async function getOrganization(): Promise<Organization> {
  if (cache) return cache;

  const existing = await db.query.organization.findFirst({
    where: eq(organization.id, ORGANIZATION_ID),
  });

  if (existing) {
    cache = existing;
    return existing;
  }

  const [inserted] = await db
    .insert(organization)
    .values({ id: ORGANIZATION_ID, ...ORGANIZATION_DEFAULTS })
    .onConflictDoNothing({ target: organization.id })
    .returning();

  if (inserted) {
    cache = inserted;
    return inserted;
  }

  // Lost the race to a concurrent insert — read the winner's row.
  const reRead = await db.query.organization.findFirst({
    where: eq(organization.id, ORGANIZATION_ID),
  });

  if (!reRead) {
    throw new DatabaseError("Organization row disappeared during upsert-on-read");
  }

  cache = reRead;
  return reRead;
}

/**
 * Updates the singleton organization row. Ensures the row exists first
 * (upsert-on-read), applies the validated input as a full replacement of
 * the editable columns (the `settings` JSON column is not edited through
 * this path), invalidates the cache, and records the actor in the log.
 */
export async function updateOrganization(
  input: OrganizationUpdateInput,
  actorId: string,
): Promise<Organization> {
  await getOrganization();

  const [updated] = await db
    .update(organization)
    .set({
      name: input.name,
      legalName: input.legalName,
      logo: input.logo,
      website: input.website,
      supportEmail: input.supportEmail,
      locale: input.locale,
      currency: input.currency,
      timezone: input.timezone,
    })
    .where(eq(organization.id, ORGANIZATION_ID))
    .returning();

  if (!updated) {
    throw new DatabaseError("Failed to update the organization row");
  }

  cache = updated;

  logger.info("Organization settings updated", { actorId, name: updated.name });

  return updated;
}

/**
 * Formats a monetary amount using the organization's currency and locale
 * (Intl.NumberFormat, server-side). Falls back to en-US/USD if the stored
 * locale/currency pair is somehow invalid, so a bad settings row can never
 * break money rendering.
 */
export function formatCurrency(
  amount: number,
  org: Pick<Organization, "currency" | "locale">,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(org.locale, {
      style: "currency",
      currency: org.currency,
      ...options,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      ...options,
    }).format(amount);
  }
}
