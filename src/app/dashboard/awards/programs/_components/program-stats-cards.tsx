"use client";

import { Archive, Award, FolderOpen, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AwardProgramOverallStatistics } from "@/types/award.types";
import { formatEnumLabel } from "./program-utils";

export function ProgramStatsCards({ statistics }: { statistics: AwardProgramOverallStatistics }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Programs (this page)</p>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-bold">{statistics.totalPrograms}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {statistics.draftPrograms} drafts, {statistics.archivedPrograms} archived
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Open (this page)</p>
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
              <FolderOpen className="h-4 w-4 text-success" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-bold">{statistics.openPrograms}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {statistics.closedPrograms} closed
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Nominations (this page)</p>
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
              <Award className="h-4 w-4 text-accent-foreground" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-bold">{statistics.totalNominations}</span>
            <span className="text-xs text-muted-foreground mt-1">across listed programs</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">Categories (this page)</p>
            <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
              <Archive className="h-4 w-4 text-warning" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-bold">{statistics.categoryBreakdown.length}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {statistics.categoryBreakdown[0]
                ? `${formatEnumLabel(statistics.categoryBreakdown[0].category)} leads`
                : "no programs yet"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
