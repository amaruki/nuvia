"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, FolderOpen, Target } from "lucide-react";
import type { WorkspaceStatisticsCardProps } from "./types";

export function WorkspaceHealthCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Workspace Health</CardTitle>
        <CardDescription>Status distribution across all workspaces</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center gap-4">
        {/* Status Item: Active */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Active</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            {statistics.activeWorkspaces}
          </Badge>
        </div>

        {/* Status Item: Archived */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <FolderOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Archived</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200"
          >
            {statistics.archivedWorkspaces}
          </Badge>
        </div>

        {/* Status Item: Locked */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <Target className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Locked</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-rose-50 text-rose-700 border-rose-200"
          >
            {statistics.lockedWorkspaces}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
