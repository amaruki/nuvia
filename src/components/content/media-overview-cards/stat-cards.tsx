"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Eye, HardDrive } from "lucide-react";
import type { MediaStatisticsCardProps } from "./types";
import { formatNumber } from "./helpers";

export function TotalMediaCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Media</CardTitle>
        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
          <HardDrive className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(statistics.totalMedia)}</div>
        <p className="text-xs text-muted-foreground">{statistics.totalSizeFormatted} stored</p>
      </CardContent>
    </Card>
  );
}

export function TotalViewsCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
        <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
          <Eye className="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</div>
        <p className="text-xs text-muted-foreground">Across all media items</p>
      </CardContent>
    </Card>
  );
}

export function TotalDownloadsCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Total Downloads</CardTitle>
        <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
          <Download className="h-4 w-4 text-orange-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(statistics.totalDownloads)}</div>
        <p className="text-xs text-muted-foreground">
          {formatNumber(Math.round((statistics.totalDownloads / statistics.totalViews) * 100))}%
          download rate
        </p>
      </CardContent>
    </Card>
  );
}

export function StorageUsedCard({ statistics }: MediaStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
        <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
          <HardDrive className="h-4 w-4 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{statistics.totalSizeFormatted}</div>
        <p className="text-xs text-muted-foreground">{formatNumber(statistics.totalMedia)} files</p>
      </CardContent>
    </Card>
  );
}
