import type {
  Media,
  MediaStatistics,
  MediaStatus,
  MediaType,
  MediaVisibility,
} from "@/types/media";

import { formatBytes } from "./hydrate-media";

/**
 * Statistics derived from the real upload manifest (backlog F2). Usage
 * metrics, top performers and monthly trends have no backing store yet and
 * are honestly zero/empty.
 */
export function buildMediaStatistics(items: Media[]): MediaStatistics {
  const totalMedia = items.length;
  const totalSize = items.reduce((sum, item) => sum + item.metadata.size, 0);
  // Percentages are only computed for buckets that exist, which implies
  // totalMedia > 0.
  const byType: Record<string, { count: number; size: number }> = {};
  const byStatus: Record<string, number> = {};
  const byVisibility: Record<string, number> = {};
  for (const item of items) {
    const entry = byType[item.type] ?? { count: 0, size: 0 };
    entry.count += 1;
    entry.size += item.metadata.size;
    byType[item.type] = entry;
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    byVisibility[item.visibility] = (byVisibility[item.visibility] ?? 0) + 1;
  }

  return {
    totalMedia,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    mediaByType: Object.entries(byType).map(([type, entry]) => ({
      type: type as MediaType,
      count: entry.count,
      size: entry.size,
      sizeFormatted: formatBytes(entry.size),
      percentage: Math.round((entry.count / totalMedia) * 100),
    })),
    mediaByStatus: Object.entries(byStatus).map(([status, count]) => ({
      status: status as MediaStatus,
      count,
      percentage: Math.round((count / totalMedia) * 100),
    })),
    mediaByVisibility: Object.entries(byVisibility).map(([visibility, count]) => ({
      visibility: visibility as MediaVisibility,
      count,
      percentage: Math.round((count / totalMedia) * 100),
    })),
    // B4's local-disk store is the only storage backend; cloud buckets are
    // honestly zero.
    storageUsage: { local: totalSize, s3: 0, cloudinary: 0, azure: 0, gcs: 0 },
    // No analytics store exists yet (no media table), so usage metrics are
    // honest zeros.
    totalViews: 0,
    totalDownloads: 0,
    totalUsage: 0,
    recentUploads: [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        size: item.metadata.size,
        uploadedBy: item.createdBy,
        uploadedAt: new Date(item.createdAt),
      })),
    topPerforming: [],
    monthlyTrends: [],
  };
}
