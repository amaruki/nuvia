"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Archive,
  Folder,
  Settings,
  Filter,
  Eye,
  BarChart3,
  Upload,
  Grid3X3,
  List,
  Search,
  HardDrive,
  Users,
  Lock,
  Globe,
  Shield,
  Trash2,
  Copy,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

import { useMedia } from "@/lib/hooks/use-media";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Media, MediaFolder, MediaType, MediaStatus, MediaVisibility } from "@/types/media.types";
import { MediaDetailsModal } from "@/components/content/media-details-modal";
import { MediaUpload } from "@/components/content/media-upload";
import { MediaFilters } from "@/components/content/media-filters";

export default function ContentMedia() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [viewingMedia, setViewingMedia] = useState<Media | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    media,
    folders,
    statistics,
    loading,
    error,
    filters,
    currentPage,
    totalPages,
    totalItems,
    uploadMedia,
    updateMedia,
    deleteMedia,
    duplicateMedia,
    bulkDelete,
    bulkUpdate,
    bulkMove,
    exportMedia,
    importMedia,
    updateFilters,
    clearFilters,
    refreshData,
    toggleMediaSelection,
    clearSelection,
  } = useMedia();

  useEffect(() => {
    setHeader({
      title: "Media Library",
      description:
        "Manage your media assets with comprehensive organization, version control, and analytics",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (mediaItem: Media) => {
    setViewingMedia(mediaItem);
  };

  const handleEdit = (mediaItem: Media) => {
    router.push(`/dashboard/content/media/edit/${mediaItem.id}`);
  };

  const handleDelete = async (mediaItem: Media) => {
    if (
      confirm(`Are you sure you want to delete "${mediaItem.title}"? This action cannot be undone.`)
    ) {
      try {
        await deleteMedia(mediaItem.id);
      } catch (error) {
        logger.error("Error deleting media", error);
      }
    }
  };

  const handleDuplicate = async (mediaItem: Media) => {
    try {
      await duplicateMedia(mediaItem.id);
    } catch (error) {
      logger.error("Error duplicating media", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMedia.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedMedia.length} selected items? This action cannot be undone.`,
      )
    ) {
      try {
        await bulkDelete(selectedMedia);
        clearSelection();
      } catch (error) {
        logger.error("Error bulk deleting", error);
      }
    }
  };

  const handleBulkMove = async (folderId: string) => {
    if (selectedMedia.length === 0) return;

    try {
      await bulkMove(selectedMedia, folderId);
      clearSelection();
    } catch (error) {
      logger.error("Error bulk moving", error);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    exportMedia(format);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importMedia(file);
      } catch (error) {
        logger.error("Error importing media", error);
      }
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      await uploadMedia(files, {
        folderId: selectedFolder || undefined,
        visibility: "private",
        generateThumbnail: true,
        generatePreview: true,
        extractMetadata: true,
      });
    } catch (error) {
      logger.error("Error uploading media", error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getMediaIcon = (type: MediaType) => {
    const iconMap = {
      image: ImageIcon,
      video: Video,
      audio: Music,
      document: FileText,
      archive: Archive,
      spreadsheet: FileText,
      presentation: FileText,
      pdf: FileText,
      vector: ImageIcon,
      font: FileText,
    };
    return iconMap[type] || FileText;
  };

  const getStatusColor = (status: MediaStatus) => {
    const colorMap = {
      uploading: "blue",
      processing: "amber",
      ready: "emerald",
      failed: "red",
      archived: "slate",
    };
    return colorMap[status] || "slate";
  };

  const getVisibilityIcon = (visibility: MediaVisibility) => {
    const iconMap = {
      public: Globe,
      private: Lock,
      restricted: Users,
      draft: Eye,
    };
    return iconMap[visibility] || Lock;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-2"></div>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Media</p>
                <p className="text-2xl font-bold">{formatNumber(statistics.totalMedia)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <HardDrive className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{statistics.totalSizeFormatted}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <HardDrive className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(statistics.totalViews)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">{formatNumber(statistics.totalDownloads)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                <Download className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {totalItems} items total
          </Badge>
          {selectedMedia.length > 0 && (
            <Badge variant="default" className="text-sm">
              {selectedMedia.length} selected
            </Badge>
          )}
          {selectedFolder && (
            <Badge variant="secondary" className="text-sm">
              Folder: {folders.find((f) => f.id === selectedFolder)?.name}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setShowUpload(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <MediaFilters
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
          />
        </div>
      )}

      {/* Folder Navigation */}
      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
        <Button
          variant={selectedFolder === null ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedFolder(null)}
        >
          <Folder className="mr-2 h-4 w-4" />
          All Media
        </Button>
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={selectedFolder === folder.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedFolder(folder.id)}
          >
            <Folder className="mr-2 h-4 w-4" />
            {folder.name}
          </Button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedMedia.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
          <span className="text-sm font-medium">Bulk Actions:</span>
          <Button variant="outline" size="sm" onClick={() => handleBulkMove("folder_images")}>
            <Folder className="mr-2 h-4 w-4" />
            Move to Images
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkMove("folder_documents")}>
            <Folder className="mr-2 h-4 w-4" />
            Move to Documents
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedMedia.length})
          </Button>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="library" className="text-xs sm:text-sm py-2 px-2">
            Library
          </TabsTrigger>
          <TabsTrigger value="folders" className="text-xs sm:text-sm py-2 px-2">
            Folders
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Uploads</h3>
              <div className="space-y-3">
                {statistics?.recentUploads.slice(0, 5).map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        {React.createElement(getMediaIcon(upload.type), { className: "h-4 w-4" })}
                        <div>
                          <p className="text-sm font-medium truncate">{upload.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {upload.uploadedBy} • {upload.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {(upload.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage by Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Storage by Type</h3>
              <div className="space-y-3">
                {statistics?.mediaByType.map((type) => (
                  <div
                    key={type.type}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        {React.createElement(getMediaIcon(type.type), { className: "h-4 w-4" })}
                        <div>
                          <p className="text-sm font-medium capitalize">{type.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {type.count} items • {type.sizeFormatted}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">{type.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performing Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Top Performing Media</h3>
            <div className="space-y-3">
              {statistics?.topPerforming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      {React.createElement(getMediaIcon(item.type), { className: "h-4 w-4" })}
                      <div>
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(item.views)} views • {formatNumber(item.downloads)}{" "}
                          downloads
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">{item.usage}</p>
                    <p className="text-xs text-muted-foreground">usage</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="mr-2 h-4 w-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="mr-2 h-4 w-4" />
                Table
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search media..."
                  className="pl-10 pr-4 py-2 border rounded-md text-sm"
                  value={filters.search || ""}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Media Grid/Table */}
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className={`relative group cursor-pointer rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${
                    selectedMedia.includes(item.id) ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => toggleMediaSelection(item.id)}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedMedia.includes(item.id)}
                      onChange={() => toggleMediaSelection(item.id)}
                      className="h-4 w-4 rounded border-primary"
                    />
                  </div>

                  {/* Media Preview */}
                  <div className="aspect-square bg-muted relative">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.altText || item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {React.createElement(getMediaIcon(item.type), {
                          className: "h-8 w-8 text-muted-foreground",
                        })}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="outline"
                        className={`text-xs bg-white/90 backdrop-blur`}
                        style={{ borderColor: `rgb(var(--${getStatusColor(item.status)}))` }}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    {/* Visibility Icon */}
                    <div className="absolute bottom-2 right-2">
                      <div className="h-6 w-6 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                        {React.createElement(getVisibilityIcon(item.visibility), {
                          className: "h-3 w-3",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Media Info */}
                  <div className="p-3">
                    <h4 className="font-medium truncate mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.type} • {(item.metadata.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(item);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(item);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMedia.length === media.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMedia(media.map((item) => item.id));
                          } else {
                            clearSelection();
                          }
                        }}
                        className="h-4 w-4 rounded border-primary"
                      />
                    </th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Size</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Visibility</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {media.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedMedia.includes(item.id)}
                          onChange={() => toggleMediaSelection(item.id)}
                          className="h-4 w-4 rounded border-primary"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {React.createElement(getMediaIcon(item.type), { className: "h-4 w-4" })}
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{item.type}</td>
                      <td className="p-3 text-sm">
                        {(item.metadata.size / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: `rgb(var(--${getStatusColor(item.status)}))` }}
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {React.createElement(getVisibilityIcon(item.visibility), {
                            className: "h-3 w-3",
                          })}
                          <span className="text-xs">{item.visibility}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{item.createdAt.toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(item)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(item)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1) })}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">{folder.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {React.createElement(getVisibilityIcon(folder.visibility), {
                      className: "h-4 w-4",
                    })}
                  </div>
                </div>

                {folder.description && (
                  <p className="text-sm text-muted-foreground mb-3">{folder.description}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span>{folder.mediaCount} items</span>
                  <span>{(folder.totalSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  Modified: {folder.lastModified.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Media Analytics</p>
            <p className="text-sm mb-4">
              Track views, downloads, and usage patterns across your media library
            </p>
            <Link href="/dashboard/content/media/analytics">
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
        <span className="text-sm font-medium">Import/Export:</span>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleImport}
            className="hidden"
            id="import-media"
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="import-media" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </label>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Media Details Modal */}
      {viewingMedia && (
        <MediaDetailsModal
          media={viewingMedia}
          isOpen={!!viewingMedia}
          onClose={() => setViewingMedia(null)}
          onEdit={handleEdit}
          onDelete={(mediaId) => handleDelete(viewingMedia!)}
          onDownload={(media) => window.open(media.url, "_blank")}
          onShare={(media) => {
            // Simple share implementation - copy URL to clipboard
            navigator.clipboard.writeText(media.url);
            alert("Media URL copied to clipboard!");
          }}
        />
      )}

      {/* Upload Modal */}
      {showUpload && <MediaUpload onUpload={handleUpload} onClose={() => setShowUpload(false)} />}
    </div>
  );
}
