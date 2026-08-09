"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Award, TrendingDown, TrendingUp } from "lucide-react";
import type { Committee } from "@/types/committee";
import { cn } from "@/lib/utils";
import { getStatusIcon, getStatusIconColor } from "./helpers";
import { CommitteeActionsMenu } from "./committee-actions-menu";
import {
  CommitteeAuthorityBadge,
  CommitteeStatusBadge,
  CommitteeTypeBadge,
} from "./committee-badges";

export interface CommitteeRowProps {
  committee: Committee;
  isToggling: boolean;
  onViewDetails: (committee: Committee) => void;
  onEdit: (committee: Committee) => void;
  onDelete: (committee: Committee) => void;
  onToggleStatus: (committee: Committee, status: "active" | "inactive") => void;
}

export function CommitteeRow({
  committee,
  isToggling,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: CommitteeRowProps) {
  const StatusIcon = getStatusIcon(committee.status);
  const attendancePositive = committee.metrics.meetingAttendanceRate - 80 >= 0;
  const goalPositive = committee.metrics.goalCompletionRate - 75 >= 0;
  const GoalIcon = goalPositive ? TrendingUp : TrendingDown;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <StatusIcon className={cn("h-4 w-4", getStatusIconColor(committee.status))} />
          </div>
          <div>
            <div className="font-medium">{committee.displayName}</div>
            <div className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(committee.createdAt, { addSuffix: true })}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <CommitteeTypeBadge type={committee.type} />
          <div className="text-xs text-muted-foreground">
            <CommitteeAuthorityBadge authority={committee.charter.authorityLevel} />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <CommitteeStatusBadge status={committee.status} />
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{committee.metrics.memberCount}</div>
          <div className="text-sm text-muted-foreground">
            {committee.metrics.activeMembersCount} active
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <span
            className={cn("font-medium", attendancePositive ? "text-emerald-600" : "text-rose-600")}
          >
            {committee.metrics.meetingAttendanceRate.toFixed(1)}%
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <GoalIcon
            className={cn("h-4 w-4", goalPositive ? "text-emerald-500" : "text-rose-500")}
          />
          <span className={cn("font-medium", goalPositive ? "text-emerald-600" : "text-rose-600")}>
            {committee.metrics.goalCompletionRate.toFixed(1)}%
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{committee.metrics.deliverablesCount}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Award className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{committee.metrics.impactScore.toFixed(1)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          {committee.leadership.slice(0, 3).map((leader) => (
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
          {committee.leadership.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              +{committee.leadership.length - 3}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <CommitteeActionsMenu
          committee={committee}
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
