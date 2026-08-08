import { MediaType } from "@/types/media";

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
