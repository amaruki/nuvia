"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { AnnouncementStatisticsCardProps } from "./types";
import { formatNumber, getPriorityColor } from "./helpers";

export function PriorityDistributionCard({ statistics }: AnnouncementStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Priority Distribution</CardTitle>
        <CardDescription>Distribution by announcement priority</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.announcementsByPriority
            .sort((a, b) => {
              const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
              return (
                priorityOrder[b.priority as keyof typeof priorityOrder] -
                priorityOrder[a.priority as keyof typeof priorityOrder]
              );
            })
            .slice(0, 4)
            .map((priority) => (
              <div
                key={priority.priority}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      priority.priority === "urgent"
                        ? "bg-red-100"
                        : priority.priority === "high"
                          ? "bg-amber-100"
                          : priority.priority === "medium"
                            ? "bg-blue-100"
                            : "bg-slate-100"
                    }`}
                  >
                    <AlertTriangle className={`h-4 w-4 ${getPriorityColor(priority.priority)}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{priority.priority}</p>
                    <p className="text-xs text-muted-foreground">{priority.count} announcements</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{formatNumber(priority.count)}</span>
                  <p className="text-xs text-muted-foreground">announcements</p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
