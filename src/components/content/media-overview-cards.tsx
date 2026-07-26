"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HardDrive,
  Eye,
  Download,
  TrendingUp,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Archive,
  Users,
  Clock,
  BarChart3,
} from "lucide-react";
import { MediaStatistics } from "@/types/media.types";

interface MediaOverviewCardsProps {
  statistics: MediaStatistics | null;
  loading?: boolean;
}

export function MediaOverviewCards({ statistics, loading = false }: MediaOverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-8 w-8 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded mb-2"></div>
              <div className="h-3 w-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No statistics available</p>
        <p className="text-sm">Media statistics will appear here once data is loaded</p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Media */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Media</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.totalMedia)}</div>
            <p className="text-xs text-muted-foreground">{statistics.totalSizeFormatted} stored</p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</div>
            <p className="text-xs text-muted-foreground">Across all media items</p>
          </CardContent>
        </Card>

        {/* Total Downloads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Downloads
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
              <Download className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.totalDownloads)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(Math.round((statistics.totalDownloads / statistics.totalViews) * 100))}%
              download rate
            </p>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Used
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSizeFormatted}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(statistics.totalMedia)} files
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Media by Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Media by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statistics.mediaByType.map((type) => {
              const getIcon = (mediaType: string) => {
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

              return (
                <div
                  key={type.type}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">{getIcon(type.type)}</div>
                    <div>
                      <p className="font-medium capitalize">{type.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {type.count} items • {type.sizeFormatted}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{type.percentage}%</p>
                    <p className="text-xs text-muted-foreground">of total</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Storage by Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Storage by Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(statistics.storageUsage).map(([location, size]) => {
              const getLocationIcon = (loc: string) => {
                switch (loc) {
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

              const getLocationName = (loc: string) => {
                switch (loc) {
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
                    return loc;
                }
              };

              const totalStorage = Object.values(statistics.storageUsage).reduce(
                (sum, val) => sum + val,
                0,
              );
              const percentage = Math.round((size / totalStorage) * 100);

              return (
                <div
                  key={location}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>{getLocationIcon(location)}</div>
                    <div>
                      <p className="font-medium">{getLocationName(location)}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(size)} bytes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{percentage}%</p>
                    <p className="text-xs text-muted-foreground">of total</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics.recentUploads.slice(0, 5).map((upload) => {
              const getUploadIcon = (type: string) => {
                switch (type) {
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

              return (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">{getUploadIcon(upload.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{upload.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {upload.uploadedBy} • {upload.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">
                      {(upload.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Performing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics.topPerforming.slice(0, 5).map((item) => {
              const getPerformIcon = (type: string) => {
                switch (type) {
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

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">{getPerformIcon(item.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(item.views)} views • {formatNumber(item.downloads)} downloads
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">{item.usage}</p>
                    <p className="text-xs text-muted-foreground">usage</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Media Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics.mediaByStatus.map((status) => (
              <div
                key={status.status}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={status.status === "ready" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {status.status}
                  </Badge>
                  <div>
                    <p className="font-medium capitalize">{status.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {status.count} items • {status.percentage}% of total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{status.count}</p>
                  <p className="text-xs text-muted-foreground">files</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Visibility Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics.mediaByVisibility.map((visibility) => {
              const getVisibilityIcon = (vis: string) => {
                switch (vis) {
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

              return (
                <div
                  key={visibility.visibility}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>{getVisibilityIcon(visibility.visibility)}</div>
                    <div>
                      <p className="font-medium capitalize">{visibility.visibility}</p>
                      <p className="text-sm text-muted-foreground">
                        {visibility.count} items • {visibility.percentage}% of total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{visibility.count}</p>
                    <p className="text-xs text-muted-foreground">files</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
