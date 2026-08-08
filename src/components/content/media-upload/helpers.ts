import { Archive, FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import type { MediaType } from "@/types/media";

export const getMediaIcon = (type: string) => {
  const iconMap = {
    "image/": ImageIcon,
    "video/": Video,
    "audio/": Music,
    "application/pdf": FileText,
    "text/": FileText,
    "application/zip": Archive,
    "application/x-zip-compressed": Archive,
  };

  for (const [mimeType, icon] of Object.entries(iconMap)) {
    if (type.startsWith(mimeType)) {
      return icon;
    }
  }

  return FileText;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
};

export const getFileType = (file: File): MediaType => {
  const type = file.type.toLowerCase();

  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("pdf")) return "pdf";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "archive";
  if (type.includes("sheet") || type.includes("excel")) return "spreadsheet";
  if (type.includes("presentation") || type.includes("powerpoint")) return "presentation";
  if (type.includes("font")) return "font";
  if (type.includes("svg")) return "vector";

  return "document";
};
