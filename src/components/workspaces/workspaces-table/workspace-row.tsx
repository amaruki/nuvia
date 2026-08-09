"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import type { CommitteeWorkspace } from "@/types/committee";
import { cn } from "@/lib/utils";
import { formatFileSize, getStatusIcon, getStatusIconColor } from "./helpers";
import { WorkspaceActionsMenu } from "./workspace-actions-menu";
import { WorkspaceStatusBadge, WorkspaceTypeBadge } from "./workspace-badges";

export interface WorkspaceRowProps {
  workspace: CommitteeWorkspace;
  isToggling: boolean;
  onViewDetails: (workspace: CommitteeWorkspace) => void;
  onEdit: (workspace: CommitteeWorkspace) => void;
  onDelete: (workspace: CommitteeWorkspace) => void;
  onToggleStatus: (workspace: CommitteeWorkspace, status: "active" | "archived") => void;
}

export function WorkspaceRow({
  workspace,
  isToggling,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: WorkspaceRowProps) {
  const StatusIcon = getStatusIcon(workspace.status);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <StatusIcon className={cn("h-4 w-4", getStatusIconColor(workspace.status))} />
          </div>
          <div>
            <div className="font-medium">{workspace.name}</div>
            <div className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(workspace.createdAt, { addSuffix: true })}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <WorkspaceTypeBadge type={workspace.type} />
          <div className="text-xs text-muted-foreground">
            {workspace.settings.isPublic ? "Public" : "Private"}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <WorkspaceStatusBadge status={workspace.status} />
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{workspace.members.length}</div>
          <div className="text-sm text-muted-foreground">
            {workspace.members.filter((m) => m.isActive).length} active
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{workspace.documents.length}</div>
          <div className="text-sm text-muted-foreground">
            {workspace.documents.length > 0
              ? formatFileSize(workspace.documents.reduce((sum, doc) => sum + doc.fileSize, 0))
              : "0 Bytes"}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{workspace.tasks.length}</div>
          <div className="text-sm text-muted-foreground">
            {workspace.tasks.filter((t) => t.status === "completed").length} completed
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{workspace.discussions.length}</div>
          <div className="text-sm text-muted-foreground">
            {workspace.discussions.reduce((sum, d) => sum + d.replyCount, 0)} replies
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{workspace.meetings.length}</div>
          <div className="text-sm text-muted-foreground">
            {workspace.meetings.filter((m) => m.status === "completed").length} completed
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{workspace.activity.length}</span>
          <span className="text-xs text-muted-foreground">activities</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          {workspace.members.slice(0, 3).map((member) => (
            <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="text-xs">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          ))}
          {workspace.members.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              +{workspace.members.length - 3}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <WorkspaceActionsMenu
          workspace={workspace}
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
