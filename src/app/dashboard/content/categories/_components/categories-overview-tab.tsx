import { TabsContent } from "@/components/ui/tabs";

import {
  CategoriesBreakdown,
  CategoriesOverviewCards,
  CategoriesStatusBreakdown,
  MostUsedCategories,
} from "@/components/content/categories-overview-cards";
import type { CategoryStatistics } from "@/types/category.types";

interface CategoriesOverviewTabProps {
  statistics: CategoryStatistics | null;
}

export function CategoriesOverviewTab({ statistics }: CategoriesOverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      {statistics && (
        <>
          <CategoriesOverviewCards statistics={statistics} />
          <div className="grid gap-6 md:grid-cols-2">
            <CategoriesBreakdown statistics={statistics} />
            <CategoriesStatusBreakdown statistics={statistics} />
          </div>
          {statistics.mostUsedCategories && statistics.mostUsedCategories.length > 0 && (
            <MostUsedCategories categories={statistics.mostUsedCategories} />
          )}
        </>
      )}
    </TabsContent>
  );
}
