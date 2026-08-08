"use client";

import React from "react";
import { Copy, Edit, Eye, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Media } from "@/types/media.types";
import { getMediaIcon, getStatusColor, getVisibilityIcon } from "./media-helpers";

interface MediaTableProps {
  media: Media[];
  selectedMedia: string[];
  setSelectedMedia: (ids: string[]) => void;
  toggleMediaSelection: (id: string) => void;
  clearSelection: () => void;
  onViewDetails: (mediaItem: Media) => void;
  onEdit: (mediaItem: Media) => void;
  onDuplicate: (mediaItem: Media) => void;
  onDelete: (mediaItem: Media) => void;
}

export function MediaTable({
  media,
  selectedMedia,
  setSelectedMedia,
  toggleMediaSelection,
  clearSelection,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
}: MediaTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left">
              <input
                type="checkbox"
                checked={selectedMedia.length === media.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMedia(media.map((item) => item.id));
                  } else {
                    clearSelection();
                  }
                }}
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
          {media.map((item) => (
            <tr key={item.id} className="border-t hover:bg-muted/50">
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selectedMedia.includes(item.id)}
                  onChange={() => toggleMediaSelection(item.id)}
                  className="h-4 w-4 rounded border-primary"
                />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {React.createElement(getMediaIcon(item.type), { className: "h-4 w-4" })}
                  <span className="font-medium">{item.title}</span>
                </div>
              </td>
              <td className="p-3 text-sm">{item.type}</td>
              <td className="p-3 text-sm">{(item.metadata.size / 1024 / 1024).toFixed(2)} MB</td>
              <td className="p-3">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: `rgb(var(--${getStatusColor(item.status)}))` }}
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
              <td className="p-3 text-sm">{item.createdAt.toLocaleDateString()}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
