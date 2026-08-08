"use client";

import { Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MediaFolder } from "@/types/media.types";

interface FolderNavProps {
  folders: MediaFolder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderNav({ folders, selectedFolder, onSelectFolder }: FolderNavProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
      <Button
        variant={selectedFolder === null ? "default" : "ghost"}
        size="sm"
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="mr-2 h-4 w-4" />
        All Media
      </Button>
      {folders.map((folder) => (
        <Button
          key={folder.id}
          variant={selectedFolder === folder.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectFolder(folder.id)}
        >
          <Folder className="mr-2 h-4 w-4" />
          {folder.name}
        </Button>
      ))}
    </div>
  );
}
