import { BarChart3, Eye, Pin, Zap } from "lucide-react";

import type { AnnouncementStatistics } from "@/types/announcement";

interface OverviewTabProps {
  statistics: AnnouncementStatistics | null;
}

export function OverviewTab({ statistics }: OverviewTabProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Total Acknowledgments</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat("en-US").format(statistics?.totalAcknowledgments || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
                  <BarChart3 className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm font-medium">Acknowledgment Rate</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {statistics?.averageAcknowledgmentRate.toFixed(1) || 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
                  <Zap className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-sm font-medium">Urgent</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{statistics?.urgentAnnouncements || 0}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent">
                  <Pin className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-sm font-medium">Pinned</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{statistics?.pinnedAnnouncements || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Announcement Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="min-w-0 flex-1 mr-2">
              <p className="font-medium">Total Announcements</p>
              <p className="text-xs text-muted-foreground">All announcements in the system</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold">
                {new Intl.NumberFormat("en-US").format(statistics?.totalAnnouncements || 0)}
              </p>
              <p className="text-xs text-muted-foreground">total</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
