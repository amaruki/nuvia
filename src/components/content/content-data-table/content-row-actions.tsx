"use client";

import { Archive, CheckCircle2, Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ContentRowActionsProps<TRow extends { status: string }> {
  row: TRow;
  /** Accessible row name for the trigger label. */
  label: string;
  onView: (row: TRow) => void;
  onEdit: (row: TRow) => void;
  onDuplicate: (row: TRow) => void;
  onDelete: (row: TRow) => void;
  /** Offered on drafts (articles, publications, announcements). */
  onPublish?: (row: TRow) => void;
  /** Offered on published items. */
  onArchive?: (row: TRow) => void;
}

/**
 * Row action menu shared by the content tables. Replaces the three
 * per-collection menus (article/announcement/publication) which had the same
 * shape: view, edit, duplicate, conditional publish/archive, delete.
 */
export function ContentRowActions<TRow extends { status: string }>({
  row,
  label,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onArchive,
}: ContentRowActionsProps<TRow>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open actions for {label}</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(row)} className="flex items-center gap-2">
          <Eye className="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row)} className="flex items-center gap-2">
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(row)} className="flex items-center gap-2">
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        {onPublish && row.status === "draft" ? (
          <DropdownMenuItem onClick={() => onPublish(row)} className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Publish
          </DropdownMenuItem>
        ) : null}
        {onArchive && row.status === "published" ? (
          <DropdownMenuItem onClick={() => onArchive(row)} className="flex items-center gap-2">
            <Archive className="size-4" />
            Archive
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(row)}
          className="flex items-center gap-2 text-red-600 focus:text-red-600"
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
