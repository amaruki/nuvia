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
import type { Article } from "@/types/article";

export interface ArticleActionsMenuProps {
  article: Article;
  onViewDetails: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onDuplicate: (article: Article) => void;
  onPublish: (article: Article) => void;
  onArchive: (article: Article) => void;
}

export function ArticleActionsMenu({
  article,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
}: ArticleActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(article)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(article)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(article)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {article.status === "draft" && (
          <DropdownMenuItem onClick={() => onPublish(article)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Publish
          </DropdownMenuItem>
        )}
        {article.status === "published" && (
          <DropdownMenuItem onClick={() => onArchive(article)}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.open(`/articles/${article.slug}`, "_blank")}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        {article.downloadEnabled && (
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(article)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
