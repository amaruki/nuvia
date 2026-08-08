"use client";

import { Download, Filter, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnnouncementStatistics } from "@/types/announcement";

interface ActionBarProps {
  totalItems: number;
  statistics: AnnouncementStatistics | null;
  selectedCount: number;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onAdd: () => void;
}

export function ActionBar({
  totalItems,
  statistics,
  selectedCount,
  onToggleFilters,
  onRefresh,
  onAdd,
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {totalItems} announcements total
        </Badge>
        {statistics && (
          <Badge variant="secondary" className="text-sm">
            {statistics.activeAnnouncements} published
          </Badge>
        )}
        {selectedCount > 0 && (
          <Badge variant="default" className="text-sm">
            {selectedCount} selected
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="flex-1 sm:flex-none"
        >
          <Filter className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex-1 sm:flex-none">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button size="sm" className="flex-1 sm:flex-none" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Announcement</span>
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
