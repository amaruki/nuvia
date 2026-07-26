"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { UserProfileWidget } from "@/components/dashboard/widgets/user-profile-widget";
import { NotificationsWidget } from "@/components/dashboard/widgets/notifications-widget";
import { EnhancedUpcomingEventsWidget } from "@/components/dashboard/widgets/enhanced-upcoming-events-widget";
import { RecentArticlesWidget } from "@/components/dashboard/widgets/recent-articles-widget";
import { EnhancedCertificatesWidget } from "@/components/dashboard/widgets/enhanced-certificates-widget";
import { CommunityActivityWidget } from "@/components/dashboard/widgets/community-activity-widget";
import { PersonalRecommendationsWidget } from "@/components/dashboard/widgets/personal-recommendations-widget";
import { MemberStatisticsWidget } from "@/components/dashboard/widgets/member-statistics-widget";
import { EventActivityWidget } from "@/components/dashboard/widgets/event-activity-widget";
import { RecentContentWidget } from "@/components/dashboard/widgets/recent-content-widget";
import { ModerationWidget } from "@/components/dashboard/widgets/moderation-widget";
import { FinanceWidget } from "@/components/dashboard/widgets/finance-widget";
import { AnalyticsWidget } from "@/components/dashboard/widgets/analytics-widget";
import { GlobalSearchWidget } from "@/components/dashboard/widgets/global-search-widget";
import { QuickNavigationWidget } from "@/components/dashboard/widgets/quick-navigation-widget";
import { CommunityHighlightsWidget } from "@/components/dashboard/widgets/community-highlights-widget";
import { UserRole } from "@/types/dashboard.types";
import { useDashboardStats } from "@/contexts/dashboard-context";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";

/**
 * Mock user role - in a real app, this would come from authentication
 */
const userRole: UserRole = "admin"; // Change to "admin" to see admin widgets

/**
 * Dashboard page component that displays user-specific widgets and information.
 * The layout is automatically applied by Next.js from the layout.tsx file.
 *
 * @returns JSX.Element
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isPending } = useSession();
  const { updateMemberStats, updateEventStats } = useDashboardStats();

  // Mock data fetching functions - replace with actual API calls
  const fetchMemberStats = React.useCallback(async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      totalMembers: 1245,
      activeMembers: 892,
      newMembers: 23,
    };
  }, []);

  const fetchEventStats = React.useCallback(async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      upcomingEvents: 8,
      totalEvents: 156,
      thisWeekEvents: 3,
    };
  }, []);

  // Real-time updates for member stats (every 30 seconds)
  const memberStatsUpdate = useRealtimeUpdates(fetchMemberStats, {
    enabled: true,
    interval: 30000,
    pauseWhenHidden: true,
  });

  // Real-time updates for event stats (every 45 seconds)
  const eventStatsUpdate = useRealtimeUpdates(fetchEventStats, {
    enabled: true,
    interval: 45000,
    pauseWhenHidden: true,
  });

  // Update global state when data is fetched
  React.useEffect(() => {
    if (memberStatsUpdate.data) {
      updateMemberStats(memberStatsUpdate.data);
    }
  }, [memberStatsUpdate.data, updateMemberStats]);

  React.useEffect(() => {
    if (eventStatsUpdate.data) {
      updateEventStats(eventStatsUpdate.data);
    }
  }, [eventStatsUpdate.data, updateEventStats]);

  // Show loading state while checking authentication
  if (isPending) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Admin-only Widgets */}
      {userRole === "admin" && (
        <>
          <div className="xl:col-span-2">
            <FinanceWidget />
          </div>

          <div className="xl:col-span-2">
            <AnalyticsWidget />
          </div>

          {/* Statistics Section */}
          <div className="xl:col-span-4">
            <MemberStatisticsWidget />
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
