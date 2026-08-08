import type { PublicationStatistics } from "@/types/publication";
import { formatNumber } from "./publications-helpers";

interface AnalyticsTabProps {
  statistics: PublicationStatistics | null;
}

export function AnalyticsTab({ statistics }: AnalyticsTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Performance by Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Performance by Type</h3>
        <div className="space-y-3">
          {statistics?.publicationsByType.map((type) => (
            <div
              key={type.type}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-medium">{type.type.replace("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{type.count} publications</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{formatNumber(type.views)}</p>
                <p className="text-xs text-muted-foreground">
                  {type.engagement.toFixed(1)}% engagement
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance by Category */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Performance by Category</h3>
        <div className="space-y-3">
          {statistics?.publicationsByCategory.map((category) => (
            <div
              key={category.category}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-medium">{category.category.replace("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{category.count} publications</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{formatNumber(category.views)}</p>
                <p className="text-xs text-muted-foreground">
                  {category.engagement.toFixed(1)}% engagement
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
