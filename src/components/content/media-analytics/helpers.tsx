import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
} from "lucide-react";

export const getMediaIcon = (type: string) => {
  switch (type) {
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "document":
    case "presentation":
    case "spreadsheet":
    case "pdf":
      return <FileText className="h-4 w-4" />;
    case "archive":
      return <Archive className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getChangeIcon = (change: number) => {
  if (change > 0) return <ArrowUpRight className="h-3 w-3 text-success" />;
  if (change < 0) return <ArrowDownRight className="h-3 w-3 text-destructive" />;
  return null;
};

export const getChangeColor = (change: number) => {
  if (change > 0) return "text-success";
  if (change < 0) return "text-destructive";
  return "text-muted-foreground";
};
