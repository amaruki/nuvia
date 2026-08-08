import type { Media } from "@/types/media";

export interface MediaGridProps {
  media: Media[];
  selectedMedia: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onViewDetails: (media: Media) => void;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
  onDuplicate: (media: Media) => void;
  loading?: boolean;
  viewMode?: "grid" | "table";
  onViewModeChange?: (mode: "grid" | "table") => void;
}

export interface MediaGridCardProps {
  item: Media;
  isSelected: boolean;
  onSelectItem: (mediaId: string, checked: boolean) => void;
  onViewDetails: (media: Media) => void;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
  onDuplicate: (media: Media) => void;
}

export interface MediaGridRowProps {
  item: Media;
  isSelected: boolean;
  onSelectItem: (mediaId: string, checked: boolean) => void;
  onViewDetails: (media: Media) => void;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
  onDuplicate: (media: Media) => void;
}

export interface MediaGridTableProps {
  media: Media[];
  selectedMedia: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onSelectItem: (mediaId: string, checked: boolean) => void;
  onViewDetails: (media: Media) => void;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
  onDuplicate: (media: Media) => void;
}
