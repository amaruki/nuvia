"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  Download,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Archive,
  Lock,
  Users,
  Globe,
  Grid3X3,
  List,
} from "lucide-react";
import { Media, MediaType, MediaStatus, MediaVisibility } from "@/types/media.types";
import { cn } from "@/lib/utils";

interface MediaGridProps {
  media: Media[];
  selectedMedia: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onViewDetails: (media: Media) => void;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
  onDuplicate: (media: Media) => void;
  loading?: boolean;
  viewMode?: "grid" | "table";
  onViewModeChange?: (mode: "grid" | "table") => void;
}

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLButtonElement>(null);

  const getMediaIcon = (type: MediaType) => {
    const iconMap = {
      image: ImageIcon,
      video: Video,
      audio: Music,
      document: FileText,
      archive: Archive,
      spreadsheet: FileText,
      presentation: FileText,
      pdf: FileText,
      vector: ImageIcon,
      font: FileText,
    };
    return iconMap[type] || FileText;
  };

  const getStatusColor = (status: MediaStatus) => {
    const colorMap = {
      uploading: "blue",
      processing: "amber",
      ready: "emerald",
      failed: "red",
      archived: "slate",
    };
    return colorMap[status] || "slate";
  };

  const getVisibilityIcon = (visibility: MediaVisibility) => {
    const iconMap = {
      public: Globe,
      private: Lock,
      restricted: Users,
      draft: Eye,
    };
    return iconMap[visibility] || Lock;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const idx = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleSelectItem = (mediaId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedMedia, mediaId]);
    } else {
      onSelectionChange(selectedMedia.filter((id) => id !== mediaId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(media.map((item) => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const isAllSelected = media.length > 0 && selectedMedia.length === media.length;
  const isIndeterminate = selectedMedia.length > 0 && selectedMedia.length < media.length;

  // Set indeterminate state on the checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      (selectAllRef.current as any).indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

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
          {media.map((item) => {
            const isSelected = selectedMedia.includes(item.id);
            const isHovered = hoveredItem === item.id;

            return (
              <Card
                key={item.id}
                className={cn(
                  "group cursor-pointer overflow-hidden transition-all hover:shadow-lg",
                  isSelected && "ring-2 ring-primary",
                  isHovered && "shadow-md",
                )}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => onViewDetails(item)}
              >
                <CardContent className="p-0">
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked: boolean) => handleSelectItem(item.id, checked)}
                      className="h-4 w-4 rounded border-primary"
                    />
                  </div>

                  {/* Media Preview */}
                  <div className="aspect-square bg-muted relative">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.altText || item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {React.createElement(getMediaIcon(item.type), {
                          className: "h-8 w-8 text-muted-foreground",
                        })}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs bg-white/90 backdrop-blur",
                          `border-${getStatusColor(item.status)}`,
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    {/* Visibility Icon */}
                    <div className="absolute bottom-2 right-2">
                      <div className="h-6 w-6 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                        {React.createElement(getVisibilityIcon(item.visibility), {
                          className: "h-3 w-3",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Media Info */}
                  <div className="p-3">
                    <h4 className="font-medium truncate mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.type} • {formatFileSize(item.metadata.size)}
                    </p>

                    {/* Actions */}
                    <div
                      className={cn(
                        "flex items-center gap-1 opacity-0 transition-opacity",
                        "group-hover:opacity-100",
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(item);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(item);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">
                  <Checkbox
                    ref={selectAllRef}
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="h-4 w-4 rounded border-primary"
                  />
                </th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Size</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Visibility</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {media.map((item) => {
                const isSelected = selectedMedia.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={cn("border-t hover:bg-muted/50", isSelected && "bg-muted/30")}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked: boolean) => handleSelectItem(item.id, checked)}
                        className="h-4 w-4 rounded border-primary"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {React.createElement(getMediaIcon(item.type), {
                          className: "h-4 w-4",
                        })}
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{item.type}</td>
                    <td className="p-3 text-sm">{formatFileSize(item.metadata.size)}</td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", `border-${getStatusColor(item.status)}`)}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {React.createElement(getVisibilityIcon(item.visibility), {
                          className: "h-3 w-3",
                        })}
                        <span className="text-xs">{item.visibility}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{formatDate(item.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDuplicate(item)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
