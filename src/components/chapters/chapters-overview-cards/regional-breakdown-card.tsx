import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { ChapterStatisticsCardProps } from "./types";

export function RegionalBreakdownCard({ statistics }: ChapterStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Regional Distribution</CardTitle>
        <CardDescription>Chapters by region</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.regionalBreakdown
            .sort((a, b) => b.chapterCount - a.chapterCount)
            .slice(0, 4)
            .map((region) => (
              <div
                key={region.region}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{region.region}</p>
                    <p className="text-xs text-muted-foreground">{region.chapterCount} chapters</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{region.memberCount.toLocaleString()}</span>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
