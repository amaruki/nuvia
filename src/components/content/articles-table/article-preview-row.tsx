"use client";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye, Share2, Timer, TrendingUp } from "lucide-react";
import { ARTICLE_DIFFICULTY_DISPLAY } from "@/types/article";
import type { Article } from "@/types/article";
import { formatNumber } from "./article-format";

export interface ArticlePreviewRowProps {
  article: Article;
}

export function ArticlePreviewRow({ article }: ArticlePreviewRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={10} className="p-4 bg-muted/20">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2">Content Preview</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{article.readTime} min read</span>
              <span>•</span>
              <span>{article.wordCount} words</span>
              <span>•</span>
              <span>{ARTICLE_DIFFICULTY_DISPLAY[article.difficulty].name}</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span>{formatNumber(article.metrics.views)} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-3 w-3 text-muted-foreground" />
                <span>{formatNumber(article.metrics.shares)} shares</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <span>{article.metrics.averageReadTime} min avg read</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span>{article.metrics.engagementScore} engagement</span>
              </div>
            </div>
            {article.tags.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium mb-2">Tags</h5>
                <div className="flex flex-wrap gap-1">
                  {article.tags.map((tag) => (
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
