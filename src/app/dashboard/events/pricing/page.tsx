/**
 * Events pricing overview (UI-23), read-only.
 *
 * Everything on this page comes from the schema as it exists today: event
 * free/paid flags and listed price points (src/db/schema/events.ts), plus
 * membership tier prices from membership_tiers. There is no promo code or
 * ticket tier table in the database, and the page says so instead of
 * inventing one.
 */

import { redirect } from "next/navigation";
import { ShieldCheck, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import { getEventPricingOverview } from "@/lib/services/event-pricing-read";
import { countActiveMembersByTier, listTiers } from "@/lib/services/membership-tier.service";
import { getOrganization } from "@/lib/services/organization.service";
import { formatCurrency, formatNumber } from "./_components/helpers";
import { PriceDistributionChart } from "./_components/price-distribution-chart";

export const dynamic = "force-dynamic";

const PATH = "/dashboard/events/pricing";

export default async function EventsPricingPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  if (!isRoleAllowedForPath(PATH, currentUser.role)) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Event Pricing</h1>
        </header>
        <Card>
          <EmptyState
            icon={<ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />}
            title="You don't have access to this page"
            description="Your current role isn't permitted to view event pricing. Contact an administrator if you believe this is a mistake."
          />
        </Card>
      </div>
    );
  }

  const [overview, tiers, memberCounts, organization] = await Promise.all([
    getEventPricingOverview(),
    listTiers(),
    countActiveMembersByTier(),
    getOrganization(),
  ]);

  const stats = [
    { label: "Total events", value: overview.totalEvents },
    { label: "Free events", value: overview.freeEvents },
    { label: "Paid events", value: overview.paidEvents },
    { label: "With a listed price", value: overview.pricedEvents },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Event Pricing</h1>
        <p className="text-muted-foreground text-sm">
          Free vs paid events, observed price points, and membership tier pricing.
          {overview.upcomingFree + overview.upcomingPaid > 0
            ? ` ${formatNumber(overview.upcomingFree)} upcoming free and ${formatNumber(
                overview.upcomingPaid,
              )} upcoming paid events.`
            : ""}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{formatNumber(stat.value)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price point distribution</CardTitle>
          <CardDescription>
            Number of events listed at each price, grouped by exact price and currency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.pricePoints.length > 0 ? (
            <PriceDistributionChart
              data={overview.pricePoints.map((point) => ({
                label: formatCurrency(point.price, point.currency),
                eventCount: point.eventCount,
              }))}
            />
          ) : (
            <EmptyState
              icon={<Tag className="size-8 text-muted-foreground" aria-hidden="true" />}
              title="No priced events yet"
              description="No event has a numeric price set. Paid events without a price still count toward the paid total above."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membership tier pricing</CardTitle>
          <CardDescription>
            Tier prices from membership_tiers, shown in the organization currency (
            {organization.currency}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <EmptyState
              title="No membership tiers configured"
              description="Membership tiers appear here once they are created under Memberships → Tiers."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase tracking-wide">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Tier
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Price
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Billing cycle
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Active subscriptions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="border-border/60 border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">
                        {tier.displayName ?? tier.name}
                        {!tier.isActive ? (
                          <span className="text-muted-foreground ml-2 text-xs">(inactive)</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {Number(tier.price) > 0
                          ? formatCurrency(tier.price, organization.currency)
                          : "Free"}
                      </td>
                      <td className="text-muted-foreground py-2.5 pr-4 capitalize">
                        {tier.billingCycle.replace("_", " ")}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {formatNumber(memberCounts.memberCounts[tier.id] ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Promo codes &amp; discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Promo codes and discounts aren't modeled in the database schema yet — there is no coupon
            or discount table to report on. Once that lands, pricing analytics for it will appear
            here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
