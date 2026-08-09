"use client";

import { toast } from "sonner";

import { MediaDetailsModal } from "@/components/content/media-details-modal";
import type { Media } from "@/types/media";

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
      onDelete={(_mediaId) => onDelete(viewingMedia!)}
      onDownload={(media) => window.open(media.url, "_blank")}
      onShare={async (media) => {
        // Simple share implementation - copy URL to clipboard
        try {
          await navigator.clipboard.writeText(media.url);
          toast.success("Media URL copied to clipboard!");
        } catch {
          toast.error("Failed to copy media URL");
        }
      }}
    />
  );
}
