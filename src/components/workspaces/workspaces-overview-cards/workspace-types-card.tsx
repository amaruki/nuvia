"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { WorkspaceStatisticsCardProps } from "./types";

export function WorkspaceTypesCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Workspace Types</CardTitle>
        <CardDescription>Distribution by workspace type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.typeBreakdown
            .sort((a, b) => b.workspaceCount - a.workspaceCount)
            .slice(0, 4)
            .map((type) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{type.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.workspaceCount} workspaces
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{type.documentCount}</span>
                  <p className="text-xs text-muted-foreground">documents</p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
