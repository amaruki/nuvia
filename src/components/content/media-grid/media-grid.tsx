"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Grid3X3, List } from "lucide-react";
import { MediaGridCard } from "./media-grid-card";
import { MediaGridTable } from "./media-grid-table";
import type { MediaGridProps } from "./types";

export function MediaGrid({
  media,
  selectedMedia,
  onSelectionChange,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  loading = false,
  viewMode = "grid",
  onViewModeChange,
}: MediaGridProps) {
  const handleSelectItem = (mediaId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedMedia, mediaId]);
    } else {
      onSelectionChange(selectedMedia.filter((id) => id !== mediaId));
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No media found</p>
          <p className="text-sm">Try adjusting your filters or upload new media files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("grid")}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("table")}
          >
            <List className="h-4 w-4 mr-2" />
            Table
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {media.length} items • {selectedMedia.length} selected
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => (
            <MediaGridCard
              key={item.id}
              item={item}
              isSelected={selectedMedia.includes(item.id)}
              onSelectItem={handleSelectItem}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <MediaGridTable
          media={media}
          selectedMedia={selectedMedia}
          onSelectionChange={onSelectionChange}
          onSelectItem={handleSelectItem}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      )}
    </div>
  );
}
