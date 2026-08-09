"use client";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Media } from "@/types/media";
import { MEDIA_TYPE_DISPLAY } from "@/types/media/display";

import { DateCell, TruncateText } from "./cells";

export interface MediaColumnHandlers {
  onViewDetails: (mediaItem: Media) => void;
  onEdit: (mediaItem: Media) => void;
  onDelete: (mediaItem: Media) => void;
}

/**
 * Media library columns (table view). Sorting is client-side over the loaded
 * page; search and pagination are server-driven via ?search/?page/?limit.
 */
export function createMediaColumns(handlers: MediaColumnHandlers): ColumnDef<Media>[] {
  return [
    {
      id: "title",
      accessorKey: "title",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <TruncateText value={row.original.title} className="font-medium" />
          <TruncateText
            value={row.original.metadata.fileName}
            className="text-muted-foreground text-xs"
          />
        </div>
      ),
    },
    {
      id: "type",
      accessorKey: "type",
      enableSorting: false,
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{MEDIA_TYPE_DISPLAY[row.original.type].name}</Badge>
      ),
    },
    {
      id: "size",
      accessorFn: (row) => row.metadata.size,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" className="justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm tabular-nums">
          {row.original.metadata.sizeFormatted}
        </div>
      ),
    },
    {
      id: "dimensions",
      enableSorting: false,
      header: "Dimensions",
      cell: ({ row }) => {
        const dimensions = row.original.metadata.dimensions;
        return (
          <span className="text-muted-foreground text-sm tabular-nums">
            {dimensions ? `${dimensions.width} × ${dimensions.height}` : "—"}
          </span>
        );
      },
    },
    {
      id: "uploadedBy",
      accessorKey: "createdBy",
      enableSorting: false,
      header: "Uploaded by",
      cell: ({ row }) => <TruncateText value={row.original.createdBy} className="text-sm" />,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded" />,
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <MediaRowActions
          mediaItem={row.original}
          onViewDetails={handlers.onViewDetails}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      ),
    },
  ];
}

interface MediaRowActionsProps extends MediaColumnHandlers {
  mediaItem: Media;
}

function MediaRowActions({ mediaItem, onViewDetails, onEdit, onDelete }: MediaRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open actions for {mediaItem.title}</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => onViewDetails(mediaItem)}
          className="flex items-center gap-2"
        >
          <Eye className="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(mediaItem)} className="flex items-center gap-2">
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(mediaItem)}
          className="flex items-center gap-2 text-red-600 focus:text-red-600"
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
