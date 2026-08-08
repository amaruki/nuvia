"use client";

import { Grid3X3, List, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Media, MediaFilters } from "@/types/media";
import { MediaGrid } from "./media-grid";
import { MediaTable } from "./media-table";

interface LibraryTabProps {
  media: Media[];
  selectedMedia: string[];
  setSelectedMedia: (ids: string[]) => void;
  toggleMediaSelection: (id: string) => void;
  clearSelection: () => void;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
  filters: MediaFilters;
  updateFilters: (filters: Partial<MediaFilters>) => void;
  currentPage: number;
  totalPages: number;
  onViewDetails: (mediaItem: Media) => void;
  onEdit: (mediaItem: Media) => void;
  onDuplicate: (mediaItem: Media) => void;
  onDelete: (mediaItem: Media) => void;
}

export function LibraryTab({
  media,
  selectedMedia,
  setSelectedMedia,
  toggleMediaSelection,
  clearSelection,
  viewMode,
  setViewMode,
  filters,
  updateFilters,
  currentPage,
  totalPages,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
}: LibraryTabProps) {
  return (
    <>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="mr-2 h-4 w-4" />
            Table
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search media..."
              className="pl-10 pr-4 py-2 border rounded-md text-sm"
              value={filters.search || ""}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Media Grid/Table */}
      {viewMode === "grid" ? (
        <MediaGrid
          media={media}
          selectedMedia={selectedMedia}
          toggleMediaSelection={toggleMediaSelection}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ) : (
        <MediaTable
          media={media}
          selectedMedia={selectedMedia}
          setSelectedMedia={setSelectedMedia}
          toggleMediaSelection={toggleMediaSelection}
          clearSelection={clearSelection}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1) })}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
