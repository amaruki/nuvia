import type { MediaAnalytics, MediaStatistics } from "@/types/media";

// Mock analytics data
export function createMockAnalytics(mediaId: string): MediaAnalytics[] {
  return [
    {
      id: "analytics-1",
      mediaId: mediaId,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      views: 245,
      uniqueViews: 189,
      avgViewDuration: 45,
      downloads: 23,
      uniqueDownloads: 18,
      usageCount: 12,
      shares: 8,
      loadTime: 234,
      errorRate: 0.2,
      topCountries: [
        { country: "United States", views: 120, percentage: 49 },
        { country: "United Kingdom", views: 45, percentage: 18 },
        { country: "Canada", views: 35, percentage: 14 },
        { country: "Australia", views: 25, percentage: 10 },
        { country: "Germany", views: 20, percentage: 8 },
      ],
      topReferrers: [
        { source: "Direct", views: 89, percentage: 36 },
        { source: "Google", views: 67, percentage: 27 },
        { source: "Social Media", views: 45, percentage: 18 },
        { source: "Email", views: 28, percentage: 11 },
        { source: "Other", views: 16, percentage: 6 },
      ],
    },
    {
      id: "analytics-2",
      mediaId: mediaId,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      views: 189,
      uniqueViews: 156,
      avgViewDuration: 38,
      downloads: 18,
      uniqueDownloads: 15,
      usageCount: 8,
      shares: 5,
      loadTime: 267,
      errorRate: 0.1,
      topCountries: [
        { country: "United States", views: 95, percentage: 50 },
        { country: "United Kingdom", views: 34, percentage: 18 },
        { country: "Canada", views: 28, percentage: 15 },
        { country: "Australia", views: 20, percentage: 11 },
        { country: "Germany", views: 12, percentage: 6 },
      ],
      topReferrers: [
        { source: "Direct", views: 68, percentage: 36 },
        { source: "Google", views: 51, percentage: 27 },
        { source: "Social Media", views: 34, percentage: 18 },
        { source: "Email", views: 21, percentage: 11 },
        { source: "Other", views: 15, percentage: 8 },
      ],
    },
  ];
}

export function createMockStatistics(): MediaStatistics {
  return {
    totalMedia: 1247,
    totalSize: 1567890123,
    totalSizeFormatted: "1.46 GB",
    mediaByType: [
      { type: "image", count: 856, size: 567890123, sizeFormatted: "541.8 MB", percentage: 68.7 },
      { type: "video", count: 156, size: 789012345, sizeFormatted: "752.7 MB", percentage: 12.5 },
      {
        type: "document",
        count: 189,
        size: 123456789,
        sizeFormatted: "117.7 MB",
        percentage: 15.2,
      },
      { type: "audio", count: 46, size: 89012345, sizeFormatted: "84.9 MB", percentage: 3.6 },
    ],
    mediaByStatus: [
      { status: "ready", count: 1189, percentage: 95.3 },
      { status: "processing", count: 34, percentage: 2.7 },
      { status: "failed", count: 12, percentage: 1.0 },
      { status: "archived", count: 12, percentage: 1.0 },
    ],
    mediaByVisibility: [
      { visibility: "public", count: 856, percentage: 68.7 },
      { visibility: "private", count: 234, percentage: 18.8 },
      { visibility: "restricted", count: 123, percentage: 9.9 },
      { visibility: "draft", count: 34, percentage: 2.7 },
    ],
    storageUsage: {
      local: 234567890,
      s3: 890123456,
      cloudinary: 345678901,
      azure: 67890123,
      gcs: 29876543,
    },
    totalViews: 45678,
    totalDownloads: 3456,
    totalUsage: 2345,
    recentUploads: [
      {
        id: "1",
        title: "Product Launch Image",
        type: "image",
        size: 2345678,
        uploadedBy: "John Doe",
        uploadedAt: new Date(),
      },
      {
        id: "2",
        title: "Company Presentation",
        type: "presentation",
        size: 5678901,
        uploadedBy: "Jane Smith",
        uploadedAt: new Date(),
      },
      {
        id: "3",
        title: "Tutorial Video",
        type: "video",
        size: 12345678,
        uploadedBy: "Mike Johnson",
        uploadedAt: new Date(),
      },
    ],
    topPerforming: [
      { id: "1", title: "Homepage Banner", type: "image", views: 5678, downloads: 234, usage: 45 },
      { id: "2", title: "Product Demo", type: "video", views: 3456, downloads: 123, usage: 23 },
      { id: "3", title: "Company Logo", type: "image", views: 2345, downloads: 456, usage: 67 },
    ],
    monthlyTrends: [
      { month: "Jan", uploads: 45, sizeAdded: 123456789, views: 3456, downloads: 234 },
      { month: "Feb", uploads: 56, sizeAdded: 234567890, views: 4567, downloads: 345 },
      { month: "Mar", uploads: 67, sizeAdded: 345678901, views: 5678, downloads: 456 },
      { month: "Apr", uploads: 78, sizeAdded: 456789012, views: 6789, downloads: 567 },
      { month: "May", uploads: 89, sizeAdded: 567890123, views: 7890, downloads: 678 },
      { month: "Jun", uploads: 90, sizeAdded: 678901234, views: 8901, downloads: 789 },
    ],
  };
}
