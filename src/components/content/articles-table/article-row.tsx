"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, Star, TrendingUp, User } from "lucide-react";
import {
  ARTICLE_CATEGORY_DISPLAY,
  ARTICLE_DIFFICULTY_DISPLAY,
  ARTICLE_STATUS_DISPLAY,
  ARTICLE_TYPE_DISPLAY,
} from "@/types/article";
import type { Article } from "@/types/article";
import { cn } from "@/lib/utils";
import { ArticleActionsMenu } from "./article-actions-menu";
import { formatDate, formatNumber, getEngagementColor } from "./article-format";
import { getCategoryIcon, getDifficultyIcon, getStatusIcon, getTypeIcon } from "./article-icons";
import { ArticlePreviewRow } from "./article-preview-row";

export interface ArticleRowProps {
  article: Article;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  onSelect: (id: string, checked: boolean) => void;
  onViewDetails: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onDuplicate: (article: Article) => void;
  onPublish: (article: Article) => void;
  onArchive: (article: Article) => void;
}

export function ArticleRow({
  article,
  isSelected,
  isExpanded,
  onToggleExpansion,
  onSelect,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
}: ArticleRowProps) {
  const TypeIcon = getTypeIcon(article.type);
  const CategoryIcon = getCategoryIcon(article.category);
  const DifficultyIcon = getDifficultyIcon(article.difficulty);
  const StatusIcon = getStatusIcon(article.status);

  return (
    <>
      <TableRow className={cn("hover:bg-muted/50", isSelected && "bg-muted/30")}>
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked: boolean) => onSelect(article.id, checked)}
            aria-label={`Select ${article.title}`}
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {article.isFeatured && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
            {article.isPinned && <div className="h-3 w-3 bg-primary rounded-full" />}
            <button
              onClick={() => onToggleExpansion(article.id)}
              className="text-left hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="truncate max-w-[200px]" title={article.title}>
                {article.title}
              </span>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {ARTICLE_TYPE_DISPLAY[article.type].name}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={ARTICLE_STATUS_DISPLAY[article.status].badgeVariant}
              className="text-xs"
            >
              {ARTICLE_STATUS_DISPLAY[article.status].name}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-sm truncate max-w-[100px]" title={article.author.name}>
              {article.author.name}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {ARTICLE_CATEGORY_DISPLAY[article.category].name}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <DifficultyIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {ARTICLE_DIFFICULTY_DISPLAY[article.difficulty].name}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-sm">{formatDate(article.publishedAt)}</TableCell>
        <TableCell className="text-right text-sm">{formatNumber(article.metrics.views)}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                getEngagementColor(article.metrics.engagementScore),
              )}
            >
              {article.metrics.engagementScore}
            </span>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </div>
        </TableCell>
        <TableCell>
          <ArticleActionsMenu
            article={article}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPublish={onPublish}
            onArchive={onArchive}
          />
        </TableCell>
      </TableRow>

      {/* Expanded Row - Quick Preview */}
      {isExpanded && <ArticlePreviewRow article={article} />}
    </>
  );
}
