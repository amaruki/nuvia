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
import type { Committee } from "@/types/committee";

export interface CommitteeActionsMenuProps {
  committee: Committee;
  isToggling: boolean;
  onViewDetails: (committee: Committee) => void;
  onEdit: (committee: Committee) => void;
  onDelete: (committee: Committee) => void;
  onToggleStatus: (committee: Committee, status: "active" | "inactive") => void;
}

export function CommitteeActionsMenu({
  committee,
  isToggling,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: CommitteeActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`Actions for ${committee.displayName}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(committee)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(committee)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={committee.contactInfo.website} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Website
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            onToggleStatus(committee, committee.status === "active" ? "inactive" : "active")
          }
          disabled={isToggling}
        >
          {committee.status === "active" ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Deactivate
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
          onClick={() => onDelete(committee)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
