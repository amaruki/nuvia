"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Edit, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatFileSize,
  getMediaIcon,
  getStatusColor,
  getVisibilityIcon,
} from "./helpers";
import type { MediaGridRowProps } from "./types";

export function MediaGridRow({
  item,
  isSelected,
  onSelectItem,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
}: MediaGridRowProps) {
  const TypeIcon = getMediaIcon(item.type);
  const VisibilityIcon = getVisibilityIcon(item.visibility);

  return (
    <tr className={cn("border-t hover:bg-muted/50", isSelected && "bg-muted/30")}>
      <td className="p-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked: boolean) => onSelectItem(item.id, checked)}
          className="h-4 w-4 rounded border-primary"
        />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4" />
          <span className="font-medium">{item.title}</span>
        </div>
      </td>
      <td className="p-3 text-sm">{item.type}</td>
      <td className="p-3 text-sm">{formatFileSize(item.metadata.size)}</td>
      <td className="p-3">
        <Badge variant="outline" className={cn("text-xs", `border-${getStatusColor(item.status)}`)}>
          {item.status}
        </Badge>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <VisibilityIcon className="h-3 w-3" />
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
}
