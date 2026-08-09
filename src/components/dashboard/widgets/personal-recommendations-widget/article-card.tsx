"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Clock, ExternalLink, Bookmark } from "lucide-react";
import { formatDate, getCategoryColor } from "./utils";
import type { RecommendedArticleCardProps } from "./types";

export function RecommendedArticleCard({ article, onReadArticle }: RecommendedArticleCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card border-border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h5 className="text-sm font-semibold text-foreground/90 line-clamp-1">
              {article.title}
            </h5>
            <Badge className={getCategoryColor(article.category)}>{article.category}</Badge>
          </div>

          <p className="text-sm text-foreground/60 mb-2 line-clamp-2">{article.excerpt}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ml-2 ${
            article.isBookmarked ? "text-chart-4" : "text-foreground/40"
          }`}
        >
          <Bookmark className="h-4 w-4" fill={article.isBookmarked ? "currentColor" : "none"} />
        </Button>
      </div>

      {/* Article metadata */}
      <div className="flex items-center justify-between text-xs text-foreground/50 mb-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{article.author}</span>
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>

          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{article.readTime} min read</span>
          </div>
        </div>
      </div>

      {/* Article actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReadArticle?.(article.id)}
          className="text-xs"
        >
          Read Article
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReadArticle?.(article.id)}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Open
        </Button>
      </div>
    </div>
  );
}
