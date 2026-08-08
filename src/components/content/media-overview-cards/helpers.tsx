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
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "down":
      return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    default:
      return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
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
      return <div className="h-4 w-4 bg-orange-500 rounded" />;
    case "local":
      return <div className="h-4 w-4 bg-blue-500 rounded" />;
    case "cloudinary":
      return <div className="h-4 w-4 bg-purple-500 rounded" />;
    case "azure":
      return <div className="h-4 w-4 bg-cyan-500 rounded" />;
    case "gcs":
      return <div className="h-4 w-4 bg-red-500 rounded" />;
    default:
      return <div className="h-4 w-4 bg-gray-500 rounded" />;
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
      return <Users className="h-4 w-4 text-blue-600" />;
    case "private":
      return <div className="h-4 w-4 bg-red-600 rounded-full" />;
    case "restricted":
      return <Users className="h-4 w-4 text-amber-600" />;
    case "draft":
      return <div className="h-4 w-4 bg-gray-600 rounded-full" />;
    default:
      return <div className="h-4 w-4 bg-gray-600 rounded-full" />;
  }
};
