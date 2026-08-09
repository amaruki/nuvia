// Typed client for the membership tier finance routes (UI-02).
//
// Every read and mutation on the tiers page goes through these functions —
// the page renders only what the API returns, and member counts come from
// real ACTIVE subscriptions (memberCounts), never mock data.

import { apiFetch } from "@/lib/api-client";

export type BillingCycle = "monthly" | "yearly" | "lifetime";

/** Wire shape of a membership_tiers row as returned by the finance routes. */
export interface TierDto {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: string; // numeric(10,2) string mode
  billingCycle: BillingCycle;
  features: string[];
  benefits: string[];
  permissions: string[];
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  trialDays: number;
  maxUsers: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TierListResult {
  tiers: TierDto[];
  total: number;
  /** ACTIVE subscription count per tier id — real counts from the DB. */
  memberCounts: Record<string, number>;
  totalActiveMembers: number;
}

export interface TierMutationInput {
  name?: string;
  displayName?: string;
  description?: string;
  price?: string;
  billingCycle?: BillingCycle;
  features?: string[];
  benefits?: string[];
  color?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  trialDays?: number;
}

/** GET /api/v1/finance/tiers?includeInactive=true with real member counts. */
export async function fetchTiersWithCounts(): Promise<TierListResult> {
  const envelope = await apiFetch<TierListResult>("/api/v1/finance/tiers?includeInactive=true", {
    method: "GET",
  });
  return envelope.data;
}

/** POST /api/v1/finance/tiers */
export async function createTierRequest(input: TierMutationInput): Promise<TierDto> {
  const envelope = await apiFetch<{ tier: TierDto }>("/api/v1/finance/tiers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return envelope.data.tier;
}

/** PATCH /api/v1/finance/tiers/:id */
export async function updateTierRequest(id: string, input: TierMutationInput): Promise<TierDto> {
  const envelope = await apiFetch<{ tier: TierDto }>(
    `/api/v1/finance/tiers/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  return envelope.data.tier;
}

/**
 * DELETE /api/v1/finance/tiers/:id — refused with 409 while subscriptions
 * still reference the tier; deactivate it instead in that case.
 */
export async function deleteTierRequest(id: string): Promise<void> {
  await apiFetch(`/api/v1/finance/tiers/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Renders a numeric(10,2) string price without trailing zeros. */
export function formatTierPrice(price: string): string {
  const value = Number(price);
  if (Number.isNaN(value)) return price;
  return `$${value % 1 === 0 ? value.toString() : value.toFixed(2)}`;
}

/** Human label for the billing cycle shown next to the price. */
export function formatBillingPeriod(cycle: BillingCycle): string {
  switch (cycle) {
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    case "lifetime":
      return "lifetime";
  }
}
