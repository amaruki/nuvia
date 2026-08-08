import type { Media } from "@/types/media";

export interface MediaDetailsModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (media: Media) => void;
  onDelete?: (mediaId: string) => void;
  onDownload?: (media: Media) => void;
  onShare?: (media: Media) => void;
  onVersionRestore?: (mediaId: string, versionId: string) => void;
}
