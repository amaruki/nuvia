"use client";

import { ArrowLeft, Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Media } from "@/types/media";

import { getMediaIcon } from "./edit-media-helpers";

interface EditMediaHeaderProps {
  media: Media;
  onGoBack: () => void;
  onPreview: () => void;
  onDelete: () => void;
}

/** Page header: back link, media icon and file name, preview/delete actions. */
export function EditMediaHeader({ media, onGoBack, onPreview, onDelete }: EditMediaHeaderProps) {
  const Icon = getMediaIcon(media.type);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Media Library
        </Button>

        <div className="flex items-center gap-2">
          <div className="text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Edit Media</h1>
            <p className="text-sm text-gray-600">{media.metadata.fileName}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>

        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
