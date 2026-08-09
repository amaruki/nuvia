/**
 * UI-33 — public membership tier catalog.
 *
 * Projects the admin tier table onto a shape that is safe to render on
 * unauthenticated pages: only active tiers, in display order, with the
 * admin internals (permissions/metadata/maxUsers/isDefault) stripped.
 * Prices stay numeric(10,2) string-mode end to end (ADR-0015 §5).
 */

import type { MembershipTier } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { getTier, listTiers } from "@/lib/services/membership-tier.service";

/** The public projection of a membership tier — no admin internals. */
export interface PublicMembershipTier {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  /** numeric(10,2) string mode — never a float. */
  price: string;
  billingCycle: string;
  features: string[];
  benefits: string[];
  color: string | null;
  icon: string | null;
  trialDays: number;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toPublicTier(tier: MembershipTier): PublicMembershipTier {
  return {
    id: tier.id,
    name: tier.name,
    displayName: tier.displayName,
    description: tier.description,
    price: tier.price,
    billingCycle: tier.billingCycle,
    features: toStringArray(tier.features),
    benefits: toStringArray(tier.benefits),
    color: tier.color,
    icon: tier.icon,
    trialDays: tier.trialDays,
  };
}

/** Active tiers in display order — the funnel's catalog. */
export async function listPublicTiers(): Promise<PublicMembershipTier[]> {
  const tiers = await listTiers(); // active only, ordered by sortOrder/price
  return tiers.map(toPublicTier);
}

/**
 * A single tier for the funnel. Inactive tiers are hidden the same way as
 * unknown ones — the public surface never confirms admin-only rows exist.
 */
export async function getPublicTier(id: string): Promise<PublicMembershipTier> {
  const tier = await getTier(id); // NotFoundError on unknown ids
  if (!tier.isActive) throw new NotFoundError("Membership tier", id);
  return toPublicTier(tier);
}
