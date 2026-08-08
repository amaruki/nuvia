import { Archive, FileText, Image as ImageIcon, Music, Video } from "lucide-react";

import type { MediaType, MediaVisibility } from "@/types/media";

/** Editable fields on the media edit form. */
export interface MediaEditFormData {
  title: string;
  description: string;
  altText: string;
  visibility: MediaVisibility;
  tags: string[];
  folderId: string;
}

/** Blank form used to seed the edit form before the media item loads. */
export const INITIAL_MEDIA_FORM_DATA: MediaEditFormData = {
  title: "",
  description: "",
  altText: "",
  visibility: "private",
  tags: [],
  folderId: "",
};

/** Maps a media type to its lucide icon, defaulting to a generic file. */
export const getMediaIcon = (type: MediaType) => {
  const iconMap: Record<MediaType, typeof FileText> = {
    image: ImageIcon,
    video: Video,
    audio: Music,
    document: FileText,
    archive: Archive,
    spreadsheet: FileText,
    presentation: FileText,
    pdf: FileText,
    vector: ImageIcon,
    font: FileText,
  };
  return iconMap[type] || FileText;
};

/** Formats a byte count into a human-readable size such as "1.5 MB". */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
};
