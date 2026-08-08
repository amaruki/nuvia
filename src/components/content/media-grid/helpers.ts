import {
  Archive,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Lock,
  Music,
  Users,
  Video,
} from "lucide-react";
import type { MediaStatus, MediaType, MediaVisibility } from "@/types/media";

export const getMediaIcon = (type: MediaType) => {
  const iconMap = {
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

export const getStatusColor = (status: MediaStatus) => {
  const colorMap = {
    uploading: "blue",
    processing: "amber",
    ready: "emerald",
    failed: "red",
    archived: "slate",
  };
  return colorMap[status] || "slate";
};

export const getVisibilityIcon = (visibility: MediaVisibility) => {
  const iconMap = {
    public: Globe,
    private: Lock,
    restricted: Users,
    draft: Eye,
  };
  return iconMap[visibility] || Lock;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};
