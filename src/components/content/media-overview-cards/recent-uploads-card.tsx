"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MediaStatisticsCardProps } from "./types";
import { getMediaTypeIcon } from "./helpers";

export function RecentUploadsCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Uploads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statistics.recentUploads.slice(0, 5).map((upload) => (
          <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">{getMediaTypeIcon(upload.type)}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{upload.title}</p>
                <p className="text-sm text-muted-foreground">
                  {upload.uploadedBy} • {upload.uploadedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-muted-foreground">
                {(upload.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
