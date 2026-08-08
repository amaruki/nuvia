"use client";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Download, Eye, Share2, TrendingUp } from "lucide-react";
import type { Publication } from "@/types/publication";
import { formatNumber } from "./publication-format";

export interface PublicationPreviewRowProps {
  publication: Publication;
}

export function PublicationPreviewRow({ publication }: PublicationPreviewRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={10} className="p-4 bg-muted/20">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2">Content Preview</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">{publication.excerpt}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{publication.readTime} min read</span>
              <span>•</span>
              <span>{publication.wordCount} words</span>
              <span>•</span>
              <span>{publication.difficulty}</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span>{formatNumber(publication.metrics.views)} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-3 w-3 text-muted-foreground" />
                <span>{formatNumber(publication.metrics.shares)} shares</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-3 w-3 text-muted-foreground" />
                <span>{formatNumber(publication.metrics.downloads)} downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span>{publication.metrics.engagementScore} engagement</span>
              </div>
            </div>
            {publication.tags.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium mb-2">Tags</h5>
                <div className="flex flex-wrap gap-1">
                  {publication.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
