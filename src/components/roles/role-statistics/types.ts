import type { Role } from "@/types/role";

export interface RoleBreakdownItem {
  role: Role;
  count: number;
  percentage: number;
  displayName: string;
  description: string;
  category: string;
}

export interface RoleStatisticsData {
  totalUsers: number;
  roleDistribution: Record<Role, number>;
  roleBreakdown: Array<RoleBreakdownItem>;
}

export interface RoleStatisticsProps {
  data?: RoleStatisticsData;
  loading?: boolean;
}

export interface RoleStatisticsSectionProps {
  data: RoleStatisticsData;
}

export interface CategoryBreakdownEntry {
  count: number;
  roles: RoleBreakdownItem[];
}
