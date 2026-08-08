import { logger } from "@/lib/logger";

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

// Create object URL for file preview
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Revoke object URL
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
