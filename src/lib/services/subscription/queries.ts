/**
 * Subscription reads — single fetch (404 on miss) and a filtered list,
 * newest first.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription } from "@/db/schema";
import type { MembershipSubscription } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import type { SubscriptionFilters } from "./types";

export async function getSubscription(id: string): Promise<MembershipSubscription> {
  const subscription = await db.query.membershipSubscription.findFirst({
    where: eq(membershipSubscription.id, id),
  });

  if (!subscription) throw new NotFoundError("MembershipSubscription", id);
  return subscription;
}

/** Newest subscriptions first; filter by user, status, or tier. */
export async function listSubscriptions(
  filters: SubscriptionFilters = {},
): Promise<MembershipSubscription[]> {
  const conditions = [];
  if (filters.userId) conditions.push(eq(membershipSubscription.userId, filters.userId));
  if (filters.status) conditions.push(eq(membershipSubscription.status, filters.status));
  if (filters.tierId) conditions.push(eq(membershipSubscription.tierId, filters.tierId));

  return db.query.membershipSubscription.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(membershipSubscription.createdAt),
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });
}
