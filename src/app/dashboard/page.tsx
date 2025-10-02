import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout/DashboardLayout"
import { UserProfileWidget } from "@/components/dashboard/widgets/UserProfileWidget"
import { NotificationsWidget } from "@/components/dashboard/widgets/NotificationsWidget"
import { UpcomingEventsWidget } from "@/components/dashboard/widgets/UpcomingEventsWidget"
import { RecentArticlesWidget } from "@/components/dashboard/widgets/RecentArticlesWidget"
import { CertificatesWidget } from "@/components/dashboard/widgets/CertificatesWidget"
import { CommunityActivityWidget } from "@/components/dashboard/widgets/CommunityActivityWidget"
import { PersonalRecommendationsWidget } from "@/components/dashboard/widgets/PersonalRecommendationsWidget"
import { MemberStatisticsWidget } from "@/components/dashboard/widgets/MemberStatisticsWidget"
import { EventActivityWidget } from "@/components/dashboard/widgets/EventActivityWidget"
import { RecentContentWidget } from "@/components/dashboard/widgets/RecentContentWidget"
import { ModerationWidget } from "@/components/dashboard/widgets/ModerationWidget"
import { FinanceWidget } from "@/components/dashboard/widgets/FinanceWidget"
import { AnalyticsWidget } from "@/components/dashboard/widgets/AnalyticsWidget"
import { GlobalSearchWidget } from "@/components/dashboard/widgets/GlobalSearchWidget"
import { QuickNavigationWidget } from "@/components/dashboard/widgets/QuickNavigationWidget"
import { CommunityHighlightsWidget } from "@/components/dashboard/widgets/CommunityHighlightsWidget"
import { UserRole } from "@/types/dashboard.types"

// Mock user data - in a real app, this would come from authentication
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "", // URL to avatar image
}

// Mock user role - in a real app, this would come from authentication
const userRole: UserRole = "member" // Change to "admin" to see admin widgets

export default function DashboardPage() {
  return (
    <DashboardLayout
      user={mockUser}
      role={userRole}
      headerProps={{
        title: "Dashboard",
        description: "Welcome back to your Nuvia community dashboard",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* User Profile Widget */}
        <UserProfileWidget />
        
        {/* Notifications Widget */}
        <NotificationsWidget />
        
        {/* Upcoming Events Widget */}
        <UpcomingEventsWidget />
        
        {/* Recent Articles Widget */}
        <RecentArticlesWidget />
        
        {/* Certificates Widget */}
        <CertificatesWidget />
        
        {/* Community Activity Widget */}
        <CommunityActivityWidget />
        
        {/* Personal Recommendations Widget */}
        <PersonalRecommendationsWidget />
        
        {/* Admin Widgets - only shown if user is admin */}
        {userRole === "admin" && (
          <>
            <MemberStatisticsWidget />
            <EventActivityWidget />
            <RecentContentWidget />
            <ModerationWidget />
            <FinanceWidget />
            <AnalyticsWidget />
          </>
        )}
        
        {/* Shared Widgets */}
        <GlobalSearchWidget />
        <QuickNavigationWidget />
        <CommunityHighlightsWidget />
      </div>
    </DashboardLayout>
  )
}