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

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

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
