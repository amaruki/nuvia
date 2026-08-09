"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { apiFetch } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { EnhancedUpcomingEventsWidget } from "@/components/dashboard/widgets/enhanced-upcoming-events-widget";
import { RecentArticlesWidget } from "@/components/dashboard/widgets/recent-articles-widget";
import { CommunityActivityWidget } from "@/components/dashboard/widgets/community-activity-widget";
import { MemberStatisticsWidget } from "@/components/dashboard/widgets/member-statistics-widget";
import { EventActivityWidget } from "@/components/dashboard/widgets/event-activity-widget";
import { RecentContentWidget } from "@/components/dashboard/widgets/recent-content-widget";
import { ModerationWidget } from "@/components/dashboard/widgets/moderation-widget";
import { FinanceWidget } from "@/components/dashboard/widgets/finance-widget";
import { AnalyticsWidget } from "@/components/dashboard/widgets/analytics-widget";
import { GlobalSearchWidget } from "@/components/dashboard/widgets/global-search-widget";
import { QuickNavigationWidget } from "@/components/dashboard/widgets/quick-navigation-widget";
import { CommunityHighlightsWidget } from "@/components/dashboard/widgets/community-highlights-widget";
import { isPredefinedRole, UserRole } from "@/types/dashboard.types";
import type {
  EventOverviewStats,
  FinanceOverviewStats,
  MemberOverviewStats,
} from "@/lib/services/dashboard-overview.service";

/**
 * Wire shape of GET /api/v1/dashboard/overview. Sections the caller lacks
 * permission for come back null; the widgets then render their empty state.
 */
interface DashboardOverviewData {
  members: MemberOverviewStats | null;
  events: EventOverviewStats | null;
  finance: FinanceOverviewStats | null;
}

/**
 * Admin dashboard view (extracted verbatim from the former page.tsx so the
 * role-aware dashboard route can keep it byte-for-byte for admin roles).
 *
 * Overview widgets (UI-01) render live aggregates from
 * /api/v1/dashboard/overview — no mock data, no fake polling. Widgets the
 * caller cannot read (or that have no data source yet) show an honest
 * empty state instead of placeholder numbers.
 */
export function AdminDashboardView() {
  const router = useRouter();
  const { user, isPending } = useSession();

  // Real session role (UI-01): falls back to "user" when the session carries
  // no recognized role.
  const userRole: UserRole = user?.role && isPredefinedRole(user.role) ? user.role : "user";

  const overviewQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const { data } = await apiFetch<{ overview: DashboardOverviewData }>(
        "/api/v1/dashboard/overview",
      );
      return data.overview;
    },
    enabled: Boolean(user),
  });
  const overview = overviewQuery.data;

  // Show loading state while checking authentication or fetching overview data
  if (isPending || (user && overviewQuery.isPending)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Loading skeletons for dashboard widgets */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You must be logged in to access the dashboard.</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/auth/signup")}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  const finance = overview?.finance ?? null;
  const members = overview?.members ?? null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Admin-only Widgets */}
      {(userRole === "admin" || userRole === "superadmin") && (
        <>
          <div className="xl:col-span-2">
            <FinanceWidget
              totalRevenue={finance?.totalRevenue}
              monthlyRevenue={finance?.monthlyRevenue}
              previousMonthRevenue={finance?.previousMonthRevenue}
              monthlyRevenueChangePercent={finance?.monthlyRevenueChangePercent}
              pendingPayments={finance?.pendingPayments}
              overduePayments={finance?.overduePayments}
              activeSubscriptions={finance?.activeSubscriptions}
              newSubscriptionsThisMonth={finance?.newSubscriptionsThisMonth}
            />
          </div>

          <div className="xl:col-span-2">
            <AnalyticsWidget />
          </div>

          {/* Statistics Section */}
          <div className="xl:col-span-4">
            <MemberStatisticsWidget
              statistics={
                members
                  ? {
                      totalMembers: members.totalMembers,
                      activeMembers: members.activeMembers,
                      newMembersThisMonth: members.newMembersThisMonth,
                      newMembersLastMonth: members.newMembersLastMonth,
                      expiredMemberships: members.expiredMemberships,
                    }
                  : undefined
              }
            />
          </div>

          <div className="xl:col-span-4">
            <ModerationWidget />
          </div>

          {/* Community Section */}
          <div className="xl:col-span-2">
            <CommunityActivityWidget />
          </div>

          {/* Activity Section */}
          <div className="xl:col-span-2">
            <EventActivityWidget />
          </div>
        </>
      )}

      {/* Events Section */}
      <div className="xl:col-span-2">
        <EnhancedUpcomingEventsWidget />
      </div>

      {/* Content Section */}
      <div className="xl:col-span-2">
        <RecentArticlesWidget />
      </div>

      {/* Recent Content Section */}
      <div className="xl:col-span-2">
        <RecentContentWidget />
      </div>

      <div className="xl:col-span-2">
        <CommunityHighlightsWidget />
      </div>

      {/* Utility Widgets */}
      <div className="xl:col-span-2">
        <GlobalSearchWidget />
      </div>

      <div className="xl:col-span-2">
        <QuickNavigationWidget />
      </div>
    </div>
  );
}
