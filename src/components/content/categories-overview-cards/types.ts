import type { CategoryStatistics } from "@/types/category.types";

export interface CategoriesOverviewCardsProps {
  statistics: CategoryStatistics;
}

export interface CategoriesBreakdownProps {
  statistics: CategoryStatistics;
}

export interface CategoriesStatusBreakdownProps {
  statistics: CategoryStatistics;
}

export interface CategoryStatisticsCardProps {
  statistics: CategoryStatistics;
}

export interface MostUsedCategoryItem {
  categoryId: string;
  name: string;
  contentCount: number;
  type: string;
  lastUsed: Date;
}

export interface MostUsedCategoriesProps {
  categories: MostUsedCategoryItem[];
}
