import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import type { TrendsTabProps } from "./types";
import { formatNumber } from "./helpers";

export function TrendsTab({ stats }: TrendsTabProps) {
  return (
    <TabsContent value="trends" className="space-y-6">
      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.monthlyTrends.map((trend) => (
              <div
                key={trend.month}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="font-medium">{trend.month}</span>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{trend.uploads}</p>
                    <p className="text-xs text-gray-600">Uploads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{formatNumber(trend.sizeAdded)}</p>
                    <p className="text-xs text-gray-600">Size Added</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{formatNumber(trend.views)}</p>
                    <p className="text-xs text-gray-600">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{formatNumber(trend.downloads)}</p>
                    <p className="text-xs text-gray-600">Downloads</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
