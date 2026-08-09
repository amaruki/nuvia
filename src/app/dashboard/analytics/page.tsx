import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, SlidersHorizontal, Users, Wallet } from "lucide-react";

import { AnalyticsGateNotice, StatCard } from "@/components/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getOrganization } from "@/lib/services/organization.service";
import { getContentAnalytics } from "@/lib/services/analytics-content";
import { getDashboardOverview } from "@/lib/services/dashboard-overview.service";
import { requireAnalyticsAccess } from "./_lib/access";

const PAGE_PATH = "/dashboard/analytics";

// The aggregates are read from the database at request time; opting out of
// static prerendering keeps `next build` from needing a live database.
export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    href: "/dashboard/analytics/members",
    title: "Member Analytics",
    description: "Signup growth, role distribution, and a login-activity proxy.",
    icon: Users,
  },
  {
    href: "/dashboard/analytics/events",
    title: "Event Analytics",
    description: "Events by month, registrations by status, capacity and check-in.",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/analytics/financial",
    title: "Financial Analytics",
    description: "Monthly revenue, invoice statuses, and the dues-vs-donations picture.",
    icon: Wallet,
  },
  {
    href: "/dashboard/analytics/content",
    title: "Content Analytics",
    description: "Volume by type, publication cadence, and category usage.",
    icon: FileText,
  },
  {
    href: "/dashboard/analytics/custom",
    title: "Custom Reports",
    description: "Every aggregate above over a 30-, 90-, or 365-day window.",
    icon: SlidersHorizontal,
  },
] as const;

export default async function AnalyticsPage() {
  const access = await requireAnalyticsAccess(PAGE_PATH);
  if ("state" in access) {
    return <AnalyticsGateNotice state={access.state} allowedRoles={access.allowedRoles} />;
  }

  const [overview, contentStats, organization] = await Promise.all([
    getDashboardOverview(),
    getContentAnalytics(),
    getOrganization(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics &amp; Reports</h1>
        <p className="text-sm text-muted-foreground">
          Live aggregates computed from the membership database — no prebaked numbers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total members"
          value={overview.members.totalMembers.toLocaleString()}
          hint={`${overview.members.activeMembers.toLocaleString()} active`}
        />
        <StatCard
          label="Upcoming events"
          value={overview.events.upcomingEvents.toLocaleString()}
          hint={`${overview.events.eventsThisWeek.toLocaleString()} in the next 7 days`}
        />
        <StatCard
          label="Revenue this month"
          value={formatCurrency(Number(overview.finance.monthlyRevenue), organization)}
          hint={`${formatCurrency(Number(overview.finance.totalRevenue), organization)} all time`}
        />
        <StatCard
          label="Published content"
          value={contentStats.published.toLocaleString()}
          hint={`${contentStats.total.toLocaleString()} items total`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group focus-visible:outline-hidden"
          >
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <section.icon aria-hidden className="h-5 w-5 text-muted-foreground" />
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">
            Sections are role-gated: each one lists exactly who navigation-data allows, and anything
            with zero rows shows an honest empty state instead of invented numbers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
