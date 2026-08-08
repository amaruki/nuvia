"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, Star, TrendingUp, User } from "lucide-react";
import { PUBLICATION_STATUS_DISPLAY, PUBLICATION_TYPE_DISPLAY } from "@/types/publication";
import type { Publication } from "@/types/publication";
import { cn } from "@/lib/utils";
import { PublicationActionsMenu } from "./publication-actions-menu";
import { formatDate, formatNumber, getEngagementColor } from "./publication-format";
import { getCategoryIcon, getStatusIcon, getTypeIcon } from "./publication-icons";
import { PublicationPreviewRow } from "./publication-preview-row";

export interface PublicationRowProps {
  publication: Publication;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  onSelect: (id: string, checked: boolean) => void;
  onViewDetails: (publication: Publication) => void;
  onEdit: (publication: Publication) => void;
  onDelete: (publication: Publication) => void;
  onDuplicate: (publication: Publication) => void;
  onPublish: (publication: Publication) => void;
  onArchive: (publication: Publication) => void;
}

export function PublicationRow({
  publication,
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
}: PublicationRowProps) {
  const TypeIcon = getTypeIcon(publication.type);
  const CategoryIcon = getCategoryIcon(publication.category);
  const StatusIcon = getStatusIcon(publication.status);

  return (
    <>
      <TableRow className={cn("hover:bg-muted/50", isSelected && "bg-muted/30")}>
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked: boolean) => onSelect(publication.id, checked)}
            aria-label={`Select ${publication.title}`}
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {publication.isFeatured && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
            {publication.isPinned && <div className="h-3 w-3 bg-primary rounded-full" />}
            <button
              onClick={() => onToggleExpansion(publication.id)}
              className="text-left hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="truncate max-w-[200px]" title={publication.title}>
                {publication.title}
              </span>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {PUBLICATION_TYPE_DISPLAY[publication.type].name}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={PUBLICATION_STATUS_DISPLAY[publication.status].badgeVariant}
              className="text-xs"
            >
              {PUBLICATION_STATUS_DISPLAY[publication.status].name}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-sm truncate max-w-[100px]" title={publication.author.name}>
              {publication.author.name}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {publication.category.replace("_", " ")}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-sm">{formatDate(publication.publishedAt)}</TableCell>
        <TableCell className="text-right text-sm">
          {formatNumber(publication.metrics.views)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                getEngagementColor(publication.metrics.engagementScore),
              )}
            >
              {publication.metrics.engagementScore}
            </span>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </div>
        </TableCell>
        <TableCell>
          <PublicationActionsMenu
            publication={publication}
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
      {isExpanded && <PublicationPreviewRow publication={publication} />}
    </>
  );
}
