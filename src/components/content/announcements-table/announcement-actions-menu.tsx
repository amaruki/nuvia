"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, CheckCircle2, Copy, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import type { Announcement } from "@/types/announcement";
import type { ArticleStatus } from "@/types/article";

export interface AnnouncementActionsMenuProps {
  announcement: Announcement;
  onView?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onDuplicate?: (announcement: Announcement) => void;
  onStatusChange?: (announcement: Announcement, status: ArticleStatus) => void;
}

export function AnnouncementActionsMenu({
  announcement,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: AnnouncementActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onView?.(announcement)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onEdit?.(announcement)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDuplicate?.(announcement)}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {announcement.status === "draft" && (
          <DropdownMenuItem
            onClick={() => onStatusChange?.(announcement, "published")}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Publish
          </DropdownMenuItem>
        )}
        {announcement.status === "published" && (
          <DropdownMenuItem
            onClick={() => onStatusChange?.(announcement, "archived")}
            className="flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete?.(announcement)}
          className="flex items-center gap-2 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
