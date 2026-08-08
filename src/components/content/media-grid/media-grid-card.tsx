"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Edit, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, getMediaIcon, getStatusColor, getVisibilityIcon } from "./helpers";
import type { MediaGridCardProps } from "./types";

export function MediaGridCard({
  item,
  isSelected,
  onSelectItem,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
}: MediaGridCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const TypeIcon = getMediaIcon(item.type);
  const VisibilityIcon = getVisibilityIcon(item.visibility);

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:shadow-lg",
        isSelected && "ring-2 ring-primary",
        isHovered && "shadow-md",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(item)}
    >
      <CardContent className="p-0">
        {/* Checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked: boolean) => onSelectItem(item.id, checked)}
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
              <TypeIcon className="h-8 w-8 text-muted-foreground" />
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
              <VisibilityIcon className="h-3 w-3" />
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
}
