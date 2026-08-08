"use client";

import { Download, Filter, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MediaFolder } from "@/types/media";

interface ActionBarProps {
  totalItems: number;
  selectedMedia: string[];
  folders: MediaFolder[];
  selectedFolder: string | null;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onShowUpload: () => void;
}

export function ActionBar({
  totalItems,
  selectedMedia,
  folders,
  selectedFolder,
  onToggleFilters,
  onRefresh,
  onShowUpload,
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {totalItems} items total
        </Badge>
        {selectedMedia.length > 0 && (
          <Badge variant="default" className="text-sm">
            {selectedMedia.length} selected
          </Badge>
        )}
        {selectedFolder && (
          <Badge variant="secondary" className="text-sm">
            Folder: {folders.find((f) => f.id === selectedFolder)?.name}
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
        <Button size="sm" className="flex-1 sm:flex-none" onClick={onShowUpload}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );
}
