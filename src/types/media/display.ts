import type { MediaStatus, MediaType, MediaVisibility } from "./base";

// Display information

export const MEDIA_TYPE_DISPLAY: Record<
  MediaType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    extensions: string[];
    maxSize: number; // in MB
  }
> = {
  image: {
    name: "Image",
    description: "Image files including photos, graphics, and illustrations",
    icon: "image",
    color: "blue",
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff"],
    maxSize: 50,
  },
  video: {
    name: "Video",
    description: "Video files for multimedia content",
    icon: "video",
    color: "purple",
    extensions: [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"],
    maxSize: 500,
  },
  audio: {
    name: "Audio",
    description: "Audio files for podcasts and music",
    icon: "music",
    color: "green",
    extensions: [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"],
    maxSize: 100,
  },
  document: {
    name: "Document",
    description: "Text documents and PDFs",
    icon: "file-text",
    color: "red",
    extensions: [".doc", ".docx", ".txt", ".rtf", ".odt"],
    maxSize: 25,
  },
  archive: {
    name: "Archive",
    description: "Compressed files and archives",
    icon: "archive",
    color: "orange",
    extensions: [".zip", ".rar", ".7z", ".tar", ".gz"],
    maxSize: 100,
  },
  spreadsheet: {
    name: "Spreadsheet",
    description: "Excel and spreadsheet files",
    icon: "grid",
    color: "emerald",
    extensions: [".xls", ".xlsx", ".csv", ".ods"],
    maxSize: 25,
  },
  presentation: {
    name: "Presentation",
    description: "PowerPoint and presentation files",
    icon: "presentation",
    color: "indigo",
    extensions: [".ppt", ".pptx", ".odp"],
    maxSize: 50,
  },
  pdf: {
    name: "PDF",
    description: "PDF documents and forms",
    icon: "file-text",
    color: "red",
    extensions: [".pdf"],
    maxSize: 50,
  },
  vector: {
    name: "Vector",
    description: "Vector graphics and illustrations",
    icon: "pen-tool",
    color: "pink",
    extensions: [".svg", ".ai", ".eps", ".svgz"],
    maxSize: 25,
  },
  font: {
    name: "Font",
    description: "Font files for typography",
    icon: "type",
    color: "cyan",
    extensions: [".ttf", ".otf", ".woff", ".woff2", ".eot"],
    maxSize: 10,
  },
};

export const MEDIA_STATUS_DISPLAY: Record<
  MediaStatus,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  uploading: {
    name: "Uploading",
    description: "File is currently being uploaded",
    icon: "upload",
    color: "blue",
    badgeVariant: "outline",
  },
  processing: {
    name: "Processing",
    description: "File is being processed and optimized",
    icon: "loader",
    color: "amber",
    badgeVariant: "outline",
  },
  ready: {
    name: "Ready",
    description: "File is ready for use",
    icon: "check-circle",
    color: "emerald",
    badgeVariant: "default",
  },
  failed: {
    name: "Failed",
    description: "File upload or processing failed",
    icon: "x-circle",
    color: "red",
    badgeVariant: "destructive",
  },
  archived: {
    name: "Archived",
    description: "File is archived and not actively used",
    icon: "archive",
    color: "slate",
    badgeVariant: "secondary",
  },
};

export const MEDIA_VISIBILITY_DISPLAY: Record<
  MediaVisibility,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  public: {
    name: "Public",
    description: "Visible to everyone",
    icon: "globe",
    color: "blue",
  },
  private: {
    name: "Private",
    description: "Only visible to you",
    icon: "lock",
    color: "red",
  },
  restricted: {
    name: "Restricted",
    description: "Visible to specific users/roles",
    icon: "users",
    color: "amber",
  },
  draft: {
    name: "Draft",
    description: "Not published, only visible to editors",
    icon: "eye-off",
    color: "slate",
  },
};
