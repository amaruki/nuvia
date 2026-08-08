import type { MediaStatistics } from "@/types/media";

export interface MediaOverviewCardsProps {
  statistics: MediaStatistics | null;
  loading?: boolean;
}

export interface MediaStatisticsCardProps {
  statistics: MediaStatistics;
}
