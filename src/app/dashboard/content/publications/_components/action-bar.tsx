"use client";

import { Download, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ActionBarProps {
  totalItems: number;
  publishedCount: number | null;
  selectedPublications: string[];
  onRefresh: () => void;
  onAdd: () => void;
}

export function ActionBar({
  totalItems,
  publishedCount,
  selectedPublications,
  onRefresh,
  onAdd,
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {totalItems} publications total
        </Badge>
        {publishedCount !== null && (
          <Badge variant="secondary" className="text-sm">
            {publishedCount} published
          </Badge>
        )}
        {selectedPublications.length > 0 && (
          <Badge variant="default" className="text-sm">
            {selectedPublications.length} selected
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
          <span className="hidden sm:inline">Add Publication</span>
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
