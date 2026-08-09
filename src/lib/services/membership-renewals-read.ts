/**
 * Renewal queue (UI-23), read-only — the admin-facing view.
 *
 * Nav roles gate this page to admin/superadmin/staff (src/lib/navigation-data),
 * so it renders the renewal attention queue over membership_subscription rows
 * rather than a member's own renewal state. Buckets derive exclusively from
 * stored fields — status, current_period_end, cancel_at_period_end — via the
 * finance subscriptions read path (listSubscriptions); nothing is scored or
 * predicted. Rows outside every bucket (e.g. ACTIVE subscriptions renewing
 * far in the future, PAUSED rows, CANCELED rows whose period already lapsed)
 * are excluded, so an empty queue is honest.
 */

import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTier, user, type MembershipSubscription } from "@/db/schema";
import { listSubscriptions } from "@/lib/services/subscription.service";

/** Renewals are surfaced this many days before current_period_end. */
export const RENEWAL_WINDOW_DAYS = 30;

/** Per-status fetch ceiling, matching the finance subscriptions API cap. */
const FETCH_LIMIT_PER_STATUS = 200;

/** Statuses that can still produce a renewal action. */
const QUEUE_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID", "CANCELED"] as const;

export type RenewalBucket = "past_due" | "lapsed" | "expiring_soon" | "wont_renew" | "in_grace";

/** Display priority: most urgent first. */
export const BUCKET_ORDER: RenewalBucket[] = [
  "past_due",
  "lapsed",
  "expiring_soon",
  "wont_renew",
  "in_grace",
];

export interface RenewalQueueItem {
  subscriptionId: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  tierLabel: string;
  status: MembershipSubscription["status"];
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  bucket: RenewalBucket;
}

export interface RenewalQueue {
  items: RenewalQueueItem[];
  counts: Record<RenewalBucket, number>;
  windowDays: number;
}

/**
 * Pure bucketing rule over stored subscription fields — exported so tests can
 * pin the semantics. Returns null for rows needing no renewal attention.
 */
export function classifyForRenewal(
  sub: Pick<MembershipSubscription, "status" | "currentPeriodEnd" | "cancelAtPeriodEnd">,
  now: Date,
): RenewalBucket | null {
  if (sub.status === "PAST_DUE" || sub.status === "UNPAID") return "past_due";

  const periodEnd = sub.currentPeriodEnd;
  if (sub.cancelAtPeriodEnd) {
    return periodEnd !== null && periodEnd.getTime() >= now.getTime() ? "wont_renew" : null;
  }
  if (sub.status === "CANCELED") {
    // CANCELED with a live period is in grace per the derived-status rules —
    // a win-back window, not yet lost.
    return periodEnd !== null && periodEnd.getTime() >= now.getTime() ? "in_grace" : null;
  }
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") return null;
  if (periodEnd === null) return null; // lifetime membership — nothing renews
  if (periodEnd.getTime() < now.getTime()) return "lapsed";
  const windowMs = RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return periodEnd.getTime() <= now.getTime() + windowMs ? "expiring_soon" : null;
}

export async function getRenewalQueue(now: Date = new Date()): Promise<RenewalQueue> {
  const byStatus = await Promise.all(
    QUEUE_STATUSES.map((status) => listSubscriptions({ status, limit: FETCH_LIMIT_PER_STATUS })),
  );
  const rows = byStatus.flat();

  const seen = new Set<string>();
  const classified: Array<MembershipSubscription & { bucket: RenewalBucket }> = [];
  for (const sub of rows) {
    if (seen.has(sub.id)) continue;
    seen.add(sub.id);
    const bucket = classifyForRenewal(sub, now);
    if (bucket !== null) classified.push(Object.assign(sub, { bucket }));
  }

  const [userRows, tierRows] = await Promise.all([
    classified.length > 0
      ? db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(
            inArray(
              user.id,
              classified.map((sub) => sub.userId),
            ),
          )
      : Promise.resolve([]),
    classified.length > 0
      ? db
          .select({
            id: membershipTier.id,
            name: membershipTier.name,
            displayName: membershipTier.displayName,
          })
          .from(membershipTier)
          .where(
            inArray(
              membershipTier.id,
              classified.map((sub) => sub.tierId),
            ),
          )
      : Promise.resolve([]),
  ]);
  const usersById = new Map(userRows.map((row) => [row.id, row]));
  const tiersById = new Map(tierRows.map((row) => [row.id, row]));

  const items: RenewalQueueItem[] = classified
    .map((sub) => {
      const owner = usersById.get(sub.userId);
      const tier = tiersById.get(sub.tierId);
      return {
        subscriptionId: sub.id,
        userId: sub.userId,
        memberName: owner?.name ?? "Unknown member",
        memberEmail: owner?.email ?? "unknown",
        tierLabel: tier?.displayName ?? tier?.name ?? "Unknown tier",
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        bucket: sub.bucket,
      };
    })
    .sort(
      (a, b) =>
        BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket) ||
        (a.currentPeriodEnd?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.currentPeriodEnd?.getTime() ?? Number.MAX_SAFE_INTEGER),
    );

  const counts = Object.fromEntries(BUCKET_ORDER.map((bucket) => [bucket, 0])) as Record<
    RenewalBucket,
    number
  >;
  for (const item of items) counts[item.bucket] += 1;

  return { items, counts, windowDays: RENEWAL_WINDOW_DAYS };
}
