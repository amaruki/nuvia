"use client";

import { MediaDetailsModal } from "@/components/content/media-details-modal";
import type { Media } from "@/types/media.types";

interface MediaDetailsSectionProps {
  viewingMedia: Media;
  onClose: () => void;
  onEdit: (mediaItem: Media) => void;
  onDelete: (mediaItem: Media) => void;
}

export function MediaDetailsSection({
  viewingMedia,
  onClose,
  onEdit,
  onDelete,
}: MediaDetailsSectionProps) {
  return (
    <MediaDetailsModal
      media={viewingMedia}
      isOpen={!!viewingMedia}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={(mediaId) => onDelete(viewingMedia!)}
      onDownload={(media) => window.open(media.url, "_blank")}
      onShare={(media) => {
        // Simple share implementation - copy URL to clipboard
        navigator.clipboard.writeText(media.url);
        alert("Media URL copied to clipboard!");
      }}
    />
  );
}
