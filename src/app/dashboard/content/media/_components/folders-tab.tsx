"use client";

import React from "react";
import { Folder } from "lucide-react";

import type { MediaFolder } from "@/types/media";
import { getVisibilityIcon } from "./media-helpers";

interface FoldersTabProps {
  folders: MediaFolder[];
  onSelectFolder: (folderId: string) => void;
}

export function FoldersTab({ folders, onSelectFolder }: FoldersTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => onSelectFolder(folder.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectFolder(folder.id);
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">{folder.name}</h3>
            </div>
            <div className="flex items-center gap-1">
              {React.createElement(getVisibilityIcon(folder.visibility), {
                className: "h-4 w-4",
              })}
            </div>
          </div>

          {folder.description && (
            <p className="text-sm text-muted-foreground mb-3">{folder.description}</p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span>{folder.mediaCount} items</span>
            <span>{(folder.totalSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Modified: {folder.lastModified.toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
