"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Media } from "@/types/media";

import { formatFileSize, getMediaIcon } from "./edit-media-helpers";

interface MediaPreviewCardProps {
  media: Media;
}

/** Sidebar card with the thumbnail (or type icon) and key file metadata. */
export function MediaPreviewCard({ media }: MediaPreviewCardProps) {
  const Icon = getMediaIcon(media.type);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {media.thumbnailUrl ? (
            <img src={media.thumbnailUrl} alt={media.title} className="w-full rounded-lg border" />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
              <Icon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{media.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{formatFileSize(media.metadata.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{media.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
