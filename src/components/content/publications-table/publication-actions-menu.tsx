"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  CheckCircle2,
  Copy,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import type { Publication } from "@/types/publication";

export interface PublicationActionsMenuProps {
  publication: Publication;
  onViewDetails: (publication: Publication) => void;
  onEdit: (publication: Publication) => void;
  onDelete: (publication: Publication) => void;
  onDuplicate: (publication: Publication) => void;
  onPublish: (publication: Publication) => void;
  onArchive: (publication: Publication) => void;
}

export function PublicationActionsMenu({
  publication,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
}: PublicationActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(publication)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(publication)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(publication)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {publication.status === "draft" && (
          <DropdownMenuItem onClick={() => onPublish(publication)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Publish
          </DropdownMenuItem>
        )}
        {publication.status === "published" && (
          <DropdownMenuItem onClick={() => onArchive(publication)}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.open(`/publications/${publication.slug}`, "_blank")}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        {publication.downloadEnabled && (
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(publication)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
