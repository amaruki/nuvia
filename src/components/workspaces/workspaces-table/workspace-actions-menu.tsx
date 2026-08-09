"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ExternalLink, Eye, MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react";
import type { CommitteeWorkspace } from "@/types/committee";

export interface WorkspaceActionsMenuProps {
  workspace: CommitteeWorkspace;
  isToggling: boolean;
  onViewDetails: (workspace: CommitteeWorkspace) => void;
  onEdit: (workspace: CommitteeWorkspace) => void;
  onDelete: (workspace: CommitteeWorkspace) => void;
  onToggleStatus: (workspace: CommitteeWorkspace, status: "active" | "archived") => void;
}

export function WorkspaceActionsMenu({
  workspace,
  isToggling,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: WorkspaceActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`Actions for ${workspace.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(workspace)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(workspace)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/dashboard/organization/committees/${workspace.committeeId}/workspace`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Workspace
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            onToggleStatus(workspace, workspace.status === "active" ? "archived" : "active")
          }
          disabled={isToggling}
        >
          {workspace.status === "active" ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Archive
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(workspace)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
