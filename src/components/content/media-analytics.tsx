"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Download, 
  Share2, 
  Users, 
  Globe,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Filter,
  DownloadCloud,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Media, type MediaAnalytics, type MediaStatistics } from "@/types/media.types";

interface MediaAnalyticsProps {
  media?: Media | null;
  statistics?: MediaStatistics | null;
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

interface AnalyticsMetric {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  color?: string;
}

interface ChartData {
  name: string;
  value: number;
  change?: number;
}

export function MediaAnalytics({ 
  media, 
  statistics, 
  timeRange = '30d',
  onTimeRangeChange,
  className 
}: MediaAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  // Mock analytics data
  const mockAnalytics: MediaAnalytics[] = [
    {
      id: 'analytics-1',
      mediaId: media?.id || '',
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
        { country: 'United States', views: 120, percentage: 49 },
        { country: 'United Kingdom', views: 45, percentage: 18 },
        { country: 'Canada', views: 35, percentage: 14 },
        { country: 'Australia', views: 25, percentage: 10 },
        { country: 'Germany', views: 20, percentage: 8 }
      ],
      topReferrers: [
        { source: 'Direct', views: 89, percentage: 36 },
        { source: 'Google', views: 67, percentage: 27 },
        { source: 'Social Media', views: 45, percentage: 18 },
        { source: 'Email', views: 28, percentage: 11 },
        { source: 'Other', views: 16, percentage: 6 }
      ]
    },
    {
      id: 'analytics-2',
      mediaId: media?.id || '',
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
        { country: 'United States', views: 95, percentage: 50 },
        { country: 'United Kingdom', views: 34, percentage: 18 },
        { country: 'Canada', views: 28, percentage: 15 },
        { country: 'Australia', views: 20, percentage: 11 },
        { country: 'Germany', views: 12, percentage: 6 }
      ],
      topReferrers: [
        { source: 'Direct', views: 68, percentage: 36 },
        { source: 'Google', views: 51, percentage: 27 },
        { source: 'Social Media', views: 34, percentage: 18 },
        { source: 'Email', views: 21, percentage: 11 },
        { source: 'Other', views: 15, percentage: 8 }
      ]
    }
  ];

  const mockStatistics: MediaStatistics = {
    totalMedia: 1247,
    totalSize: 1567890123,
    totalSizeFormatted: '1.46 GB',
    mediaByType: [
      { type: 'image', count: 856, size: 567890123, sizeFormatted: '541.8 MB', percentage: 68.7 },
      { type: 'video', count: 156, size: 789012345, sizeFormatted: '752.7 MB', percentage: 12.5 },
      { type: 'document', count: 189, size: 123456789, sizeFormatted: '117.7 MB', percentage: 15.2 },
      { type: 'audio', count: 46, size: 89012345, sizeFormatted: '84.9 MB', percentage: 3.6 }
    ],
    mediaByStatus: [
      { status: 'ready', count: 1189, percentage: 95.3 },
      { status: 'processing', count: 34, percentage: 2.7 },
      { status: 'failed', count: 12, percentage: 1.0 },
      { status: 'archived', count: 12, percentage: 1.0 }
    ],
    mediaByVisibility: [
      { visibility: 'public', count: 856, percentage: 68.7 },
      { visibility: 'private', count: 234, percentage: 18.8 },
      { visibility: 'restricted', count: 123, percentage: 9.9 },
      { visibility: 'draft', count: 34, percentage: 2.7 }
    ],
    storageUsage: {
      local: 234567890,
      s3: 890123456,
      cloudinary: 345678901,
      azure: 67890123,
      gcs: 29876543
    },
    totalViews: 45678,
    totalDownloads: 3456,
    totalUsage: 2345,
    recentUploads: [
      { id: '1', title: 'Product Launch Image', type: 'image', size: 2345678, uploadedBy: 'John Doe', uploadedAt: new Date() },
      { id: '2', title: 'Company Presentation', type: 'presentation', size: 5678901, uploadedBy: 'Jane Smith', uploadedAt: new Date() },
      { id: '3', title: 'Tutorial Video', type: 'video', size: 12345678, uploadedBy: 'Mike Johnson', uploadedAt: new Date() }
    ],
    topPerforming: [
      { id: '1', title: 'Homepage Banner', type: 'image', views: 5678, downloads: 234, usage: 45 },
      { id: '2', title: 'Product Demo', type: 'video', views: 3456, downloads: 123, usage: 23 },
      { id: '3', title: 'Company Logo', type: 'image', views: 2345, downloads: 456, usage: 67 }
    ],
    monthlyTrends: [
      { month: 'Jan', uploads: 45, sizeAdded: 123456789, views: 3456, downloads: 234 },
      { month: 'Feb', uploads: 56, sizeAdded: 234567890, views: 4567, downloads: 345 },
      { month: 'Mar', uploads: 67, sizeAdded: 345678901, views: 5678, downloads: 456 },
      { month: 'Apr', uploads: 78, sizeAdded: 456789012, views: 6789, downloads: 567 },
      { month: 'May', uploads: 89, sizeAdded: 567890123, views: 7890, downloads: 678 },
      { month: 'Jun', uploads: 90, sizeAdded: 678901234, views: 8901, downloads: 789 }
    ]
  };

  const currentStats = statistics || mockStatistics;
  const currentAnalytics = mockAnalytics;

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'document':
      case 'presentation':
      case 'spreadsheet':
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-3 w-3 text-green-600" />;
    if (change < 0) return <ArrowDownRight className="h-3 w-3 text-red-600" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const overviewMetrics: AnalyticsMetric[] = [
    {
      label: 'Total Views',
      value: formatNumber(currentAnalytics.reduce((sum, a) => sum + a.views, 0)),
      change: 12.5,
      changeType: 'increase',
      icon: <Eye className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Total Downloads',
      value: formatNumber(currentAnalytics.reduce((sum, a) => sum + a.downloads, 0)),
      change: 8.3,
      changeType: 'increase',
      icon: <Download className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Avg. View Duration',
      value: formatDuration(Math.round(currentAnalytics.reduce((sum, a) => sum + a.avgViewDuration, 0) / currentAnalytics.length)),
      change: -5.2,
      changeType: 'decrease',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Usage Count',
      value: formatNumber(currentAnalytics.reduce((sum, a) => sum + a.usageCount, 0)),
      change: 15.7,
      changeType: 'increase',
      icon: <Share2 className="h-5 w-5" />,
      color: 'text-orange-600'
    }
  ];

  const performanceMetrics: AnalyticsMetric[] = [
    {
      label: 'Load Time',
      value: `${Math.round(currentAnalytics.reduce((sum, a) => sum + a.loadTime, 0) / currentAnalytics.length)}ms`,
      change: -12.3,
      changeType: 'increase',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-indigo-600'
    },
    {
      label: 'Error Rate',
      value: `${(currentAnalytics.reduce((sum, a) => sum + a.errorRate, 0) / currentAnalytics.length).toFixed(1)}%`,
      change: -25.0,
      changeType: 'increase',
      icon: <TrendingDown className="h-5 w-5" />,
      color: 'text-red-600'
    },
    {
      label: 'Unique Views',
      value: formatNumber(currentAnalytics.reduce((sum, a) => sum + a.uniqueViews, 0)),
      change: 18.9,
      changeType: 'increase',
      icon: <Users className="h-5 w-5" />,
      color: 'text-teal-600'
    },
    {
      label: 'Shares',
      value: formatNumber(currentAnalytics.reduce((sum, a) => sum + a.shares, 0)),
      change: 22.1,
      changeType: 'increase',
      icon: <Share2 className="h-5 w-5" />,
      color: 'text-pink-600'
    }
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Media Analytics</h2>
          <p className="text-gray-600">
            {media ? `Analytics for "${media.title}"` : 'Overall media statistics and performance'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      {metric.change !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          {getChangeIcon(metric.change)}
                          <span className={cn("text-sm", getChangeColor(metric.change))}>
                            {Math.abs(metric.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={cn("text-blue-600", metric.color)}>
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Media Type Distribution */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Media by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentStats.mediaByType.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMediaIcon(type.type)}
                        <span className="capitalize">{type.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{type.count} files</span>
                        <Badge variant="secondary">{type.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Storage</span>
                    <span className="text-sm font-bold">{currentStats.totalSizeFormatted}</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(currentStats.storageUsage).map(([location, size]) => (
                      <div key={location} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{location}</span>
                        <span className="text-sm">{formatNumber(size)} bytes</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      {metric.change !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          {getChangeIcon(metric.change)}
                          <span className={cn("text-sm", getChangeColor(metric.change))}>
                            {Math.abs(metric.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={cn("text-blue-600", metric.color)}>
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentAnalytics[0]?.topCountries.map((country) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{country.country}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{country.views} views</span>
                      <Badge variant="outline">{country.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Referrers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Referrers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentAnalytics[0]?.topReferrers.map((referrer) => (
                  <div key={referrer.source} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{referrer.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{referrer.views} views</span>
                      <Badge variant="outline">{referrer.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DownloadCloud className="h-5 w-5" />
                Recent Uploads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentStats.recentUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMediaIcon(upload.type)}
                      <div>
                        <p className="font-medium">{upload.title}</p>
                        <p className="text-sm text-gray-600">
                          {upload.uploadedBy} • {upload.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatNumber(upload.size)} bytes</p>
                      <Badge variant="outline" className="text-xs">
                        {upload.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentStats.topPerforming.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMediaIcon(item.type)}
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-medium">{formatNumber(item.views)}</p>
                        <p className="text-xs text-gray-600">Views</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatNumber(item.downloads)}</p>
                        <p className="text-xs text-gray-600">Downloads</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.usage}</p>
                        <p className="text-xs text-gray-600">Usage</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentStats.monthlyTrends.map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{trend.month}</span>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium">{trend.uploads}</p>
                        <p className="text-xs text-gray-600">Uploads</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{formatNumber(trend.sizeAdded)}</p>
                        <p className="text-xs text-gray-600">Size Added</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{formatNumber(trend.views)}</p>
                        <p className="text-xs text-gray-600">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{formatNumber(trend.downloads)}</p>
                        <p className="text-xs text-gray-600">Downloads</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}