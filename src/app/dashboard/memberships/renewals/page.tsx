/**
 * Membership renewal queue (UI-23), read-only — admin-facing.
 *
 * Nav roles gate this page to admin/superadmin/staff, so it renders the
 * attention queue (src/lib/services/membership-renewals-read.ts) rather than
 * a member's own renewal state: past-due, lapsed, expiring within the window,
 * cancel-at-period-end, and in-grace rows. Every bucket derives from stored
 * subscription fields; an empty queue is honest.
 */

import { redirect } from "next/navigation";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import {
  BUCKET_ORDER,
  getRenewalQueue,
  type RenewalBucket,
} from "@/lib/services/membership-renewals-read";
import { formatPeriodEnd, formatRelativeDays } from "./_components/helpers";

export const dynamic = "force-dynamic";

const PATH = "/dashboard/memberships/renewals";

const BUCKET_LABELS: Record<RenewalBucket, string> = {
  past_due: "Past due",
  lapsed: "Lapsed",
  expiring_soon: "Expiring soon",
  wont_renew: "Cancels at period end",
  in_grace: "In grace",
};

const BUCKET_BADGE: Record<RenewalBucket, "destructive" | "warning" | "info" | "secondary"> = {
  past_due: "destructive",
  lapsed: "destructive",
  expiring_soon: "warning",
  wont_renew: "secondary",
  in_grace: "info",
};

export default async function MembershipsRenewalsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");
  const now = new Date();

  if (!isRoleAllowedForPath(PATH, currentUser.role)) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Membership Renewals</h1>
        </header>
        <Card>
          <EmptyState
            icon={<ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />}
            title="You don't have access to this page"
            description="Your current role isn't permitted to view the renewal queue. Contact an administrator if you believe this is a mistake."
          />
        </Card>
      </div>
    );
  }

  const queue = await getRenewalQueue(now);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Membership Renewals</h1>
        <p className="text-muted-foreground text-sm">
          Subscriptions needing attention — renewing within {queue.windowDays} days, past due,
          lapsed, or canceled. Built from live subscription rows.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {BUCKET_ORDER.map((bucket) => (
          <Badge key={bucket} variant={BUCKET_BADGE[bucket]}>
            {BUCKET_LABELS[bucket]}: {queue.counts[bucket]}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Renewal queue</CardTitle>
          <CardDescription>
            {queue.items.length === 0
              ? "Nothing needs attention."
              : `${queue.items.length} subscription${queue.items.length === 1 ? "" : "s"} sorted by urgency.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.items.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="size-8 text-muted-foreground" aria-hidden="true" />}
              title="No subscriptions need renewal attention"
              description={`No row is past due, lapsed, canceled, or ending within the next ${queue.windowDays} days.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase tracking-wide">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Member
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Tier
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Status
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Period ends
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Renewal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queue.items.map((item) => (
                    <tr
                      key={item.subscriptionId}
                      className="border-border/60 border-b last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="font-medium">{item.memberName}</div>
                        <div className="text-muted-foreground text-xs">{item.memberEmail}</div>
                      </td>
                      <td className="py-2.5 pr-4">{item.tierLabel}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline">{item.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div>{formatPeriodEnd(item.currentPeriodEnd)}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatRelativeDays(item.currentPeriodEnd, now)}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <Badge variant={BUCKET_BADGE[item.bucket]}>
                          {BUCKET_LABELS[item.bucket]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
