import { MediaType, MediaStatus, MediaVisibility } from "@/types/media";

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
