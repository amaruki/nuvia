"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Pin, Zap } from "lucide-react";
import type { Announcement } from "@/types/announcement";
import type { ArticleStatus } from "@/types/article";
import { AnnouncementActionsMenu } from "./announcement-actions-menu";
import { getPriorityBadge, getStatusBadge } from "./announcement-badges";
import { formatDate, isExpired } from "./announcement-format";
import { getTargetAudienceIcon, getTypeIcon } from "./announcement-icons";

export interface AnnouncementRowProps {
  announcement: Announcement;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onView?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onDuplicate?: (announcement: Announcement) => void;
  onStatusChange?: (announcement: Announcement, status: ArticleStatus) => void;
}

export function AnnouncementRow({
  announcement,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: AnnouncementRowProps) {
  const TypeIcon = getTypeIcon(announcement.type);
  const AudienceIcon = getTargetAudienceIcon(announcement.targetAudience);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={isSelected}
          onChange={(e) => onSelect(announcement.id, e.target.checked)}
        />
      </TableCell>
      <TableCell>
        <div className="max-w-[200px]">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{announcement.title}</p>
            {announcement.isPinned && <Pin className="h-3 w-3 text-primary" fill="currentColor" />}
            {announcement.isUrgent && <Zap className="h-3 w-3 text-red-500" />}
          </div>
          {isExpired(announcement.expiresAt || null) && (
            <p className="text-xs text-red-500 mt-1">Expired</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4" />
          <span className="capitalize text-sm">{announcement.type?.replace("_", " ")}</span>
        </div>
      </TableCell>
      <TableCell>{getPriorityBadge(announcement.priority)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <AudienceIcon className="h-4 w-4" />
          <span className="capitalize text-sm">
            {announcement.targetAudience?.replace("_", " ")}
          </span>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(announcement.status)}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{announcement.author.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(announcement.lastModified)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{announcement.acknowledgmentCount || 0}</span>
          {announcement.requiresAcknowledgment && (
            <span className="text-xs text-muted-foreground">Required</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span
            className={`text-sm ${
              isExpired(announcement.expiresAt || null) ? "text-red-500 font-medium" : ""
            }`}
          >
            {formatDate(announcement.expiresAt || null)}
          </span>
          {announcement.expiresAt && !isExpired(announcement.expiresAt || null) && (
            <span className="text-xs text-muted-foreground">
              {Math.ceil(
                (new Date(announcement.expiresAt).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              days left
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <AnnouncementActionsMenu
          announcement={announcement}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onStatusChange={onStatusChange}
        />
      </TableCell>
    </TableRow>
  );
}
