import { Download, Eye, HardDrive } from "lucide-react";

import type { MediaStatistics } from "@/types/media";
import { formatNumber } from "./media-helpers";

interface StatsOverviewProps {
  statistics: MediaStatistics;
}

export function StatsOverview({ statistics }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Media</p>
            <p className="text-2xl font-bold">{formatNumber(statistics.totalMedia)}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <HardDrive className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
            <p className="text-2xl font-bold">{statistics.totalSizeFormatted}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
            <HardDrive className="h-4 w-4 text-accent-foreground" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
            <Eye className="h-4 w-4 text-success" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Downloads</p>
            <p className="text-2xl font-bold">{formatNumber(statistics.totalDownloads)}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
            <Download className="h-4 w-4 text-warning" />
          </div>
        </div>
      </div>
    </div>
  );
}
