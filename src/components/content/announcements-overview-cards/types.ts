import type { AnnouncementStatistics } from "@/types/announcement";

export interface AnnouncementsOverviewCardsProps {
  statistics: AnnouncementStatistics;
}

export interface AnnouncementStatisticsCardProps {
  statistics: AnnouncementStatistics;
}

export interface EngagementBadge {
  className: string;
  text: string;
}
