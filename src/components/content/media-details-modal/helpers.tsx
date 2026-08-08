"use client";

import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Globe,
  Lock,
  Users,
} from "lucide-react";

export const getMediaIcon = (type: string) => {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Video;
  if (type.startsWith("audio/")) return Music;
  if (type.includes("pdf") || type.includes("zip")) return Archive;
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

export const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case "public":
      return <Globe className="h-4 w-4" />;
    case "private":
      return <Lock className="h-4 w-4" />;
    case "restricted":
      return <Users className="h-4 w-4" />;
    default:
      return <Lock className="h-4 w-4" />;
  }
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};
