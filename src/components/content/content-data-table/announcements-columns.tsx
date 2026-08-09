"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Announcement } from "@/types/announcement";
import {
  ANNOUNCEMENT_PRIORITY_DISPLAY,
  ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY,
} from "@/types/announcement/display";
import type { ArticleStatus } from "@/types/article";
import { ARTICLE_STATUS_DISPLAY } from "@/types/article/display";

import { AuthorCell, DateCell, TruncateText } from "./cells";
import { ContentRowActions } from "./content-row-actions";

export interface AnnouncementsColumnHandlers {
  onView: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDuplicate: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
  onStatusChange: (announcement: Announcement, status: ArticleStatus) => void;
}

/**
 * Announcements columns. Publish/archive route through the page's
 * onStatusChange handler, which hits the real status endpoint.
 */
export function createAnnouncementsColumns(
  handlers: AnnouncementsColumnHandlers,
): ColumnDef<Announcement>[] {
  return [
    {
      id: "title",
      accessorKey: "title",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Announcement" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <TruncateText value={row.original.title} className="font-medium" />
          {row.original.excerpt ? (
            <TruncateText value={row.original.excerpt} className="text-muted-foreground text-xs" />
          ) : null}
        </div>
      ),
    },
    {
      id: "author",
      accessorFn: (row) => row.author.name,
      enableSorting: false,
      header: "Author",
      cell: ({ row }) => (
        <AuthorCell
          author={{
            id: row.original.author.id,
            name: row.original.author.name,
            avatarUrl: row.original.author.avatar || undefined,
          }}
        />
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      enableSorting: false,
      header: "Status",
      cell: ({ row }) => {
        const display = ARTICLE_STATUS_DISPLAY[row.original.status];
        return <Badge variant={display.badgeVariant}>{display.name}</Badge>;
      },
    },
    {
      id: "priority",
      accessorFn: (row) => (row.isUrgent ? "urgent" : row.priority),
      enableSorting: false,
      header: "Priority",
      cell: ({ row }) => {
        // The wire only carries a numeric priority, so the hydrated value is
        // trustworthy for the urgent flag (patched from the wire) but not
        // for finer gradations — render urgent vs. the mapped default.
        const key = row.original.isUrgent ? "urgent" : row.original.priority;
        const display = ANNOUNCEMENT_PRIORITY_DISPLAY[key];
        return <Badge variant={display.badgeVariant}>{display.name}</Badge>;
      },
    },
    {
      id: "audience",
      accessorKey: "targetAudience",
      enableSorting: false,
      header: "Audience",
      cell: ({ row }) => {
        const display = ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[row.original.targetAudience];
        return <Badge variant="outline">{display.name}</Badge>;
      },
    },
    {
      id: "expiresAt",
      accessorKey: "expiresAt",
      enableSorting: false,
      header: "Expires",
      cell: ({ row }) => <DateCell value={row.original.expiresAt} fallback="Never" />,
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <ContentRowActions
          row={row.original}
          label={row.original.title}
          onView={handlers.onView}
          onEdit={handlers.onEdit}
          onDuplicate={handlers.onDuplicate}
          onDelete={handlers.onDelete}
          onPublish={(announcement) => handlers.onStatusChange(announcement, "published")}
          onArchive={(announcement) => handlers.onStatusChange(announcement, "archived")}
        />
      ),
    },
  ];
}
