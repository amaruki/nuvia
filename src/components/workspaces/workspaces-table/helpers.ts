import { Activity, CheckSquare, FolderOpen, Target } from "lucide-react";

export const getStatusIcon = (status: string) => {
  const iconMap = {
    active: CheckSquare,
    archived: FolderOpen,
    locked: Target,
  };
  return iconMap[status as keyof typeof iconMap] || Activity;
};

export const getStatusIconColor = (status: string) => {
  const colorMap = {
    active: "text-emerald-500",
    archived: "text-slate-500",
    locked: "text-rose-500",
  };
  return colorMap[status as keyof typeof colorMap] || "text-gray-500";
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
