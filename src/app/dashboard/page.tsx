"use client";

import * as React from "react";
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
import { AsyncContent } from "@/components/ui/async-content";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * Mock user data - in a real app, this would come from authentication
 */
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "", // URL to avatar image
};

/**
 * Mock user role - in a real app, this would come from authentication
 */
const userRole: UserRole = "member"; // Change to "admin" to see admin widgets

/**
 * Dashboard page component that displays user-specific widgets and information.
 * The layout is automatically applied by Next.js from the layout.tsx file.
 *
 * @returns JSX.Element
 */
export default function DashboardPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Simulate loading data
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Simulate retry
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* User Profile Section */}
      <div className="xl:col-span-1">
        <UserProfileWidget />
      </div>

      {/* Notifications Section */}
      <div className="xl:col-span-1">
        <NotificationsWidget />
      </div>

      {/* Events Section */}
      <div className="xl:col-span-2">
        <EnhancedUpcomingEventsWidget />
      </div>

      {/* Content Section */}
      <div className="xl:col-span-2">
        <RecentArticlesWidget />
      </div>

      {/* Certificates Section */}
      <div className="xl:col-span-1">
        <EnhancedCertificatesWidget />
      </div>

      {/* Community Section */}
      <div className="xl:col-span-2">
        <CommunityActivityWidget />
      </div>

      {/* Recommendations Section */}
      <div className="xl:col-span-1">
        <PersonalRecommendationsWidget />
      </div>

      {/* Statistics Section */}
      <div className="xl:col-span-2">
        <MemberStatisticsWidget />
      </div>

      {/* Activity Section */}
      <div className="xl:col-span-1">
        <EventActivityWidget />
      </div>

      {/* Recent Content Section */}
      <div className="xl:col-span-2">
        <RecentContentWidget />
      </div>

      {/* Admin-only Widgets */}
      {userRole === "admin" && (
        <>
          <div className="xl:col-span-2">
            <ModerationWidget />
          </div>
          <div className="xl:col-span-1">
            <FinanceWidget />
          </div>
          <div className="xl:col-span-1">
            <AnalyticsWidget />
          </div>
        </>
      )}

      {/* Utility Widgets */}
      <div className="xl:col-span-1">
        <GlobalSearchWidget />
      </div>
      <div className="xl:col-span-1">
        <QuickNavigationWidget />
      </div>
      <div className="xl:col-span-2">
        <CommunityHighlightsWidget />
      </div>
    </div>
  );
}
