import { MediaType, MediaStatus, MediaVisibility } from "@/types/media";
import { logger } from "@/lib/logger";

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
};

// Parse file size string back to bytes
export const parseFileSize = (sizeStr: string): number => {
  const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  return Math.round(value * (multipliers[unit] || 1));
};

// Duration formatting
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Parse duration string back to seconds
export const parseDuration = (durationStr: string): number => {
  const parts = durationStr.split(":").map(Number);

  if (parts.length === 1) return parts[0]; // seconds only
  if (parts.length === 2) return parts[0] * 60 + parts[1]; // minutes:seconds
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hours:minutes:seconds

  return 0;
};

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : "";
};

// Get filename without extension
export const getFileNameWithoutExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
};

// Generate safe filename
export const generateSafeFilename = (filename: string): string => {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);

  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
};

// Get MIME type from file extension
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    tiff: "image/tiff",

    // Videos
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    wmv: "video/x-ms-wmv",
    flv: "video/x-flv",
    webm: "video/webm",
    mkv: "video/x-matroska",

    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    rtf: "application/rtf",
    odt: "application/vnd.oasis.opendocument.text",

    // Spreadsheets
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    ods: "application/vnd.oasis.opendocument.spreadsheet",

    // Presentations
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odp: "application/vnd.oasis.opendocument.presentation",

    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",

    // Fonts
    ttf: "font/ttf",
    otf: "font/otf",
    woff: "font/woff",
    woff2: "font/woff2",
    eot: "application/vnd.ms-fontobject",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
};

// Get media type from MIME type
export const getMediaTypeFromMimeType = (mimeType: string): MediaType => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z"))
    return "archive";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "presentation";
  if (mimeType.includes("font")) return "font";
  if (mimeType.includes("svg")) return "vector";

  return "document";
};

// Get media type from file extension
export const getMediaTypeFromExtension = (extension: string): MediaType => {
  const mimeType = getMimeTypeFromExtension(extension);
  return getMediaTypeFromMimeType(mimeType);
};

// Check if file type is supported
export const isSupportedFileType = (extension: string): boolean => {
  const supportedExtensions = [
    // Images
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp",
    "tiff",
    // Videos
    "mp4",
    "avi",
    "mov",
    "wmv",
    "flv",
    "webm",
    "mkv",
    // Audio
    "mp3",
    "wav",
    "ogg",
    "flac",
    "aac",
    "m4a",
    // Documents
    "pdf",
    "doc",
    "docx",
    "txt",
    "rtf",
    "odt",
    // Spreadsheets
    "xls",
    "xlsx",
    "csv",
    "ods",
    // Presentations
    "ppt",
    "pptx",
    "odp",
    // Archives
    "zip",
    "rar",
    "7z",
    "tar",
    "gz",
    // Fonts
    "ttf",
    "otf",
    "woff",
    "woff2",
    "eot",
  ];

  return supportedExtensions.includes(extension.toLowerCase());
};

// Get maximum file size for media type (in bytes)
export const getMaxFileSize = (mediaType: MediaType): number => {
  const maxSizes: Record<MediaType, number> = {
    image: 50 * 1024 * 1024, // 50MB
    video: 500 * 1024 * 1024, // 500MB
    audio: 100 * 1024 * 1024, // 100MB
    document: 25 * 1024 * 1024, // 25MB
    archive: 100 * 1024 * 1024, // 100MB
    spreadsheet: 25 * 1024 * 1024, // 25MB
    presentation: 50 * 1024 * 1024, // 50MB
    pdf: 50 * 1024 * 1024, // 50MB
    vector: 25 * 1024 * 1024, // 25MB
    font: 10 * 1024 * 1024, // 10MB
  };

  return maxSizes[mediaType] || 25 * 1024 * 1024; // Default 25MB
};

// Generate thumbnail URL
export const generateThumbnailUrl = (
  originalUrl: string,
  width?: number,
  height?: number,
): string => {
  const url = new URL(originalUrl);
  const params = new URLSearchParams(url.search);

  if (width) params.set("w", width.toString());
  if (height) params.set("h", height.toString());
  params.set("fit", "cover");
  params.set("auto", "format");

  url.search = params.toString();
  return url.toString();
};

// Generate preview URL
export const generatePreviewUrl = (originalUrl: string): string => {
  const url = new URL(originalUrl);
  const params = new URLSearchParams(url.search);

  params.set("preview", "true");
  params.set("quality", "80");

  url.search = params.toString();
  return url.toString();
};

// Check if URL is accessible
export const checkUrlAccessibility = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

// Download file from URL
export const downloadFileFromUrl = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    logger.error("Download failed", error);
    throw error;
  }
};

// Create file from data URL
export const createFileFromDataUrl = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime || "application/octet-stream" });
};

// Generate slug from string
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Validate slug format
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
};

// Get status color for UI
export const getStatusColor = (status: MediaStatus): string => {
  const colors: Record<MediaStatus, string> = {
    uploading: "text-blue-600 bg-blue-100",
    processing: "text-yellow-600 bg-yellow-100",
    ready: "text-green-600 bg-green-100",
    failed: "text-red-600 bg-red-100",
    archived: "text-gray-600 bg-gray-100",
  };

  return colors[status] || "text-gray-600 bg-gray-100";
};

// Get visibility color for UI
export const getVisibilityColor = (visibility: MediaVisibility): string => {
  const colors: Record<MediaVisibility, string> = {
    public: "text-blue-600 bg-blue-100",
    private: "text-red-600 bg-red-100",
    restricted: "text-yellow-600 bg-yellow-100",
    draft: "text-gray-600 bg-gray-100",
  };

  return colors[visibility] || "text-gray-600 bg-gray-100";
};

// Get media type icon name
export const getMediaIconName = (mediaType: MediaType): string => {
  const icons: Record<MediaType, string> = {
    image: "image",
    video: "video",
    audio: "music",
    document: "file-text",
    archive: "archive",
    spreadsheet: "grid",
    presentation: "presentation",
    pdf: "file-text",
    vector: "pen-tool",
    font: "type",
  };

  return icons[mediaType] || "file-text";
};

// Get media type color
export const getMediaColor = (mediaType: MediaType): string => {
  const colors: Record<MediaType, string> = {
    image: "blue",
    video: "purple",
    audio: "green",
    document: "red",
    archive: "orange",
    spreadsheet: "emerald",
    presentation: "indigo",
    pdf: "red",
    vector: "pink",
    font: "cyan",
  };

  return colors[mediaType] || "gray";
};

// Calculate aspect ratio
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

// Get common aspect ratio name
export const getAspectRatioName = (width: number, height: number): string => {
  const ratio = calculateAspectRatio(width, height);
  const tolerance = 0.05;

  const commonRatios: Record<string, number> = {
    "1:1": 1,
    "4:3": 4 / 3,
    "16:9": 16 / 9,
    "21:9": 21 / 9,
    "3:2": 3 / 2,
    "5:4": 5 / 4,
  };

  for (const [name, value] of Object.entries(commonRatios)) {
    if (Math.abs(ratio - value) < tolerance) {
      return name;
    }
  }

  return `${width}:${height}`;
};

// Generate color palette from image (simplified)
export const generateColorPalette = (imageUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve([]);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      const colorMap: Record<string, number> = {};

      // Sample every 10th pixel for performance
      for (let i = 0; i < pixels.length; i += 40) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Quantize to 32 colors
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;

        const color = `rgb(${qr},${qg},${qb})`;
        colorMap[color] = (colorMap[color] || 0) + 1;
      }

      // Get top 5 colors
      const sortedColors = Object.entries(colorMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([color]) => color);

      resolve(sortedColors);
    };

    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
};

// Debounce function for search/filter operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for performance-intensive operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Format date relative to now
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

// Capitalize first letter of each word
export const capitalizeWords = (text: string): string => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL format
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Extract domain from URL
export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
};

// Check if file is an image
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};

// Check if file is a video
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith("video/");
};

// Check if file is an audio
export const isAudioFile = (file: File): boolean => {
  return file.type.startsWith("audio/");
};

// Get file category
export const getFileCategory = (file: File): string => {
  if (isImageFile(file)) return "image";
  if (isVideoFile(file)) return "video";
  if (isAudioFile(file)) return "audio";
  if (file.type.includes("pdf")) return "document";
  if (file.type.includes("zip") || file.type.includes("rar")) return "archive";
  if (file.type.includes("sheet") || file.type.includes("excel")) return "spreadsheet";
  if (file.type.includes("presentation") || file.type.includes("powerpoint")) return "presentation";
  if (file.type.includes("font")) return "font";

  return "document";
};

// Create object URL for file preview
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Revoke object URL
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
