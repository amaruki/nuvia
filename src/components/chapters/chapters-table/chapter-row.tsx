"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { MapPin, TrendingDown, TrendingUp } from "lucide-react";
import type { Chapter } from "@/types/chapter.types";
import { cn } from "@/lib/utils";
import { formatCurrency, getStatusIcon, getStatusIconColor } from "./helpers";
import { ChapterActionsMenu } from "./chapter-actions-menu";
import { ChapterStatusBadge, FinancialHealthBadge } from "./chapter-badges";

export interface ChapterRowProps {
  chapter: Chapter;
  isToggling: boolean;
  onViewDetails: (chapter: Chapter) => void;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}

export function ChapterRow({
  chapter,
  isToggling,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ChapterRowProps) {
  const StatusIcon = getStatusIcon(chapter.status);
  const GrowthIcon = chapter.metrics.memberGrowthRate >= 0 ? TrendingUp : TrendingDown;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <StatusIcon className={cn("h-4 w-4", getStatusIconColor(chapter.status))} />
          </div>
          <div>
            <div className="font-medium">{chapter.displayName}</div>
            <div className="text-sm text-muted-foreground">
              Established {formatDistanceToNow(chapter.establishedDate, { addSuffix: true })}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {chapter.location.city}, {chapter.location.state}
            </div>
            <div className="text-sm text-muted-foreground">
              {chapter.location.region} • {chapter.location.country}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <ChapterStatusBadge status={chapter.status} />
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{chapter.memberCount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            {chapter.metrics.activeMembersThisMonth} active this month
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <GrowthIcon
            className={cn(
              "h-4 w-4",
              chapter.metrics.memberGrowthRate >= 0 ? "text-emerald-500" : "text-rose-500",
            )}
          />
          <span
            className={`font-medium ${
              chapter.metrics.memberGrowthRate >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {chapter.metrics.memberGrowthRate.toFixed(1)}%
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{chapter.events.length}</div>
          <div className="text-sm text-muted-foreground">
            {chapter.metrics.eventAttendanceRate.toFixed(1)}% attendance
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{formatCurrency(chapter.finances.totalRevenue)}</div>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(chapter.finances.netIncome)} net
          </div>
        </div>
      </TableCell>
      <TableCell>
        <FinancialHealthBadge health={chapter.metrics.financialHealth} />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          {chapter.leadership.slice(0, 3).map((leader) => (
            <Avatar key={leader.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={leader.avatar} alt={leader.name} />
              <AvatarFallback className="text-xs">
                {leader.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          ))}
          {chapter.leadership.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              +{chapter.leadership.length - 3}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <ChapterActionsMenu
          chapter={chapter}
          isToggling={isToggling}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      </TableCell>
    </TableRow>
  );
}
