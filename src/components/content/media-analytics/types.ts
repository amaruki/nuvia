import React from "react";
import type { Media, MediaAnalytics, MediaStatistics } from "@/types/media";

export interface MediaAnalyticsProps {
  media?: Media | null;
  statistics?: MediaStatistics | null;
  timeRange?: "7d" | "30d" | "90d" | "1y" | "all";
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export interface AnalyticsMetric {
  label: string;
  value: number | string;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: React.ReactNode;
  color?: string;
}

interface ChartData {
  name: string;
  value: number;
  change?: number;
}

export interface OverviewTabProps {
  stats: MediaStatistics;
  analytics: MediaAnalytics[];
}

export interface PerformanceTabProps {
  analytics: MediaAnalytics[];
}

export interface UsageTabProps {
  stats: MediaStatistics;
}

export interface TrendsTabProps {
  stats: MediaStatistics;
}
