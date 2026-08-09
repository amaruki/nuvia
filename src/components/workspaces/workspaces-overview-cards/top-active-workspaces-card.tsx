"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { WorkspaceStatisticsCardProps } from "./types";
import { formatPercentage } from "./helpers";

export function TopActiveWorkspacesCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Most Active Workspaces
        </CardTitle>
        <CardDescription>By activity score and engagement rate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {statistics.topActiveWorkspaces.slice(0, 4).map((workspace, index) => {
            // Calculate percentage for bar width (relative to max activity score in set for visual)
            const maxScore = Math.max(
              ...statistics.topActiveWorkspaces.map((w) => w.activityScore),
            );
            const percentage = (workspace.activityScore / maxScore) * 100;

            return (
              <div key={workspace.workspaceId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                      {workspace.workspaceName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                    >
                      {workspace.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block">{workspace.memberCount} members</span>
                  </div>
                </div>
                {/* Visual Bar */}
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Engagement:{" "}
                    <span className="font-medium">
                      {formatPercentage(workspace.engagementRate)}
                    </span>
                  </span>
                  <span>
                    Activity:{" "}
                    <span className="font-medium">{workspace.activityScore.toFixed(1)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
