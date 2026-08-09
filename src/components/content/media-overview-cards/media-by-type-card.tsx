import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MediaStatisticsCardProps } from "./types";
import { getMediaTypeIcon } from "./helpers";

export function MediaByTypeCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Media by Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statistics.mediaByType.map((type) => (
          <div key={type.type} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">{getMediaTypeIcon(type.type)}</div>
              <div>
                <p className="font-medium capitalize">{type.type}</p>
                <p className="text-sm text-muted-foreground">
                  {type.count} items • {type.sizeFormatted}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{type.percentage}%</p>
              <p className="text-xs text-muted-foreground">of total</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
