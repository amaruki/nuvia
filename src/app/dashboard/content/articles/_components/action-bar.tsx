"use client";

import { Download, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ArticleStatistics } from "@/types/article";

interface ActionBarProps {
  totalItems: number;
  statistics: ArticleStatistics | null;
  selectedArticles: string[];
  onRefresh: () => void;
  onAdd: () => void;
}

export function ActionBar({
  totalItems,
  statistics,
  selectedArticles,
  onRefresh,
  onAdd,
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {totalItems} articles total
        </Badge>
        {statistics && (
          <Badge variant="secondary" className="text-sm">
            {statistics.publishedArticles} published
          </Badge>
        )}
        {selectedArticles.length > 0 && (
          <Badge variant="default" className="text-sm">
            {selectedArticles.length} selected
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex-1 sm:flex-none">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button size="sm" className="flex-1 sm:flex-none" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Article</span>
          <span className="sm:hidden">Add</span>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );
}
