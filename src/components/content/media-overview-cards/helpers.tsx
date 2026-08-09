import {
  Archive,
  FileText,
  Image as ImageIcon,
  Music,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

export const getTrendIcon = (trend: "up" | "down" | "stable") => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-success" />;
    case "down":
      return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
    default:
      return <div className="h-4 w-4 bg-muted-foreground rounded-full" />;
  }
};

export const getMediaTypeIcon = (mediaType: string) => {
  switch (mediaType) {
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "document":
    case "pdf":
      return <FileText className="h-4 w-4" />;
    case "archive":
      return <Archive className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export const getLocationIcon = (location: string) => {
  switch (location) {
    case "s3":
      return <div className="h-4 w-4 bg-warning rounded" />;
    case "local":
      return <div className="h-4 w-4 bg-info rounded" />;
    case "cloudinary":
      return <div className="h-4 w-4 bg-accent-foreground rounded" />;
    case "azure":
      return <div className="h-4 w-4 bg-chart-2 rounded" />;
    case "gcs":
      return <div className="h-4 w-4 bg-destructive rounded" />;
    default:
      return <div className="h-4 w-4 bg-muted-foreground rounded" />;
  }
};

export const getLocationName = (location: string): string => {
  switch (location) {
    case "s3":
      return "AWS S3";
    case "local":
      return "Local Storage";
    case "cloudinary":
      return "Cloudinary";
    case "azure":
      return "Azure Blob";
    case "gcs":
      return "Google Cloud";
    default:
      return location;
  }
};

export const getVisibilityIcon = (visibility: string) => {
  switch (visibility) {
    case "public":
      return <Users className="h-4 w-4 text-info" />;
    case "private":
      return <div className="h-4 w-4 bg-destructive rounded-full" />;
    case "restricted":
      return <Users className="h-4 w-4 text-warning" />;
    case "draft":
      return <div className="h-4 w-4 bg-muted-foreground rounded-full" />;
    default:
      return <div className="h-4 w-4 bg-muted-foreground rounded-full" />;
  }
};
