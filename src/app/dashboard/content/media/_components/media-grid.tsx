"use client";

import React from "react";
import { Copy, Edit, Eye, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Media } from "@/types/media";
import { getMediaIcon, getStatusColor, getVisibilityIcon } from "./media-helpers";

interface MediaGridProps {
  media: Media[];
  selectedMedia: string[];
  toggleMediaSelection: (id: string) => void;
  onViewDetails: (mediaItem: Media) => void;
  onEdit: (mediaItem: Media) => void;
  onDuplicate: (mediaItem: Media) => void;
  onDelete: (mediaItem: Media) => void;
}

export function MediaGrid({
  media,
  selectedMedia,
  toggleMediaSelection,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
}: MediaGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {media.map((item) => (
        <div
          key={item.id}
          className={`relative group cursor-pointer rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${
            selectedMedia.includes(item.id) ? "ring-2 ring-primary" : ""
          }`}
          role="button"
          tabIndex={0}
          aria-pressed={selectedMedia.includes(item.id)}
          onClick={() => toggleMediaSelection(item.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleMediaSelection(item.id);
            }
          }}
        >
          {/* Checkbox (visual indicator; the card itself is the toggle control) */}
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedMedia.includes(item.id)}
              onCheckedChange={() => toggleMediaSelection(item.id)}
              aria-hidden="true"
              tabIndex={-1}
              className="pointer-events-none"
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
                className={`text-xs bg-white/90 backdrop-blur`}
                style={{ borderColor: `rgb(var(--${getStatusColor(item.status)}))` }}
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
              {item.type} • {(item.metadata.size / 1024 / 1024).toFixed(2)} MB
            </p>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      ))}
    </div>
  );
}
