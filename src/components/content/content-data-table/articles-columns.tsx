"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/types/article";
import { ARTICLE_STATUS_DISPLAY } from "@/types/article/display";

import { AuthorCell, categoryLabel, DateCell, TruncateText } from "./cells";
import { ContentRowActions } from "./content-row-actions";

export interface ArticlesColumnHandlers {
  onViewDetails: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDuplicate: (article: Article) => void;
  onDelete: (article: Article) => void;
  onPublish: (article: Article) => void;
  onArchive: (article: Article) => void;
}

/**
 * Articles columns. Title and published-at sort server-side (?sortBy /
 * ?sortOrder); the status column id doubles as the faceted filter target.
 */
export function createArticlesColumns(handlers: ArticlesColumnHandlers): ColumnDef<Article>[] {
  return [
    {
      id: "title",
      accessorKey: "title",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
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
      id: "category",
      accessorFn: (row) => categoryLabel(row.category),
      enableSorting: false,
      header: "Category",
      cell: ({ row }) => (
        <TruncateText value={categoryLabel(row.original.category)} className="text-sm" />
      ),
    },
    {
      id: "publishedAt",
      accessorKey: "publishedAt",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Published" />,
      cell: ({ row }) => <DateCell value={row.original.publishedAt} fallback="Not published" />,
    },
    {
      id: "views",
      accessorFn: (row) => row.metrics.views,
      enableSorting: false,
      header: () => <div className="text-right">Views</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm tabular-nums">
          {row.original.metrics.views.toLocaleString()}
        </div>
      ),
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
          onView={handlers.onViewDetails}
          onEdit={handlers.onEdit}
          onDuplicate={handlers.onDuplicate}
          onDelete={handlers.onDelete}
          onPublish={handlers.onPublish}
          onArchive={handlers.onArchive}
        />
      ),
    },
  ];
}
