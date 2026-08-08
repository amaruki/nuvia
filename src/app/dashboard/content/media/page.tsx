"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMedia } from "@/lib/hooks/use-media";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Media } from "@/types/media";
import { MediaUpload } from "@/components/content/media-upload";
import { MediaFilters } from "@/components/content/media-filters";
import { ActionBar } from "./_components/action-bar";
import { AnalyticsTab } from "./_components/analytics-tab";
import { BulkActions } from "./_components/bulk-actions";
import { FolderNav } from "./_components/folder-nav";
import { FoldersTab } from "./_components/folders-tab";
import { ImportExportBar } from "./_components/import-export-bar";
import { LibraryTab } from "./_components/library-tab";
import { MediaDetailsSection } from "./_components/media-details-section";
import { OverviewTab } from "./_components/overview-tab";
import { ErrorState, LoadingState } from "./_components/page-states";
import { StatsOverview } from "./_components/stats-overview";

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

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <StatsOverview statistics={statistics} />}

      {/* Action Bar */}
      <ActionBar
        totalItems={totalItems}
        selectedMedia={selectedMedia}
        folders={folders}
        selectedFolder={selectedFolder}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
        onShowUpload={() => setShowUpload(true)}
      />

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
      <FolderNav
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
      />

      {/* Bulk Actions */}
      {selectedMedia.length > 0 && (
        <BulkActions
          selectedMedia={selectedMedia}
          bulkDelete={bulkDelete}
          bulkMove={bulkMove}
          clearSelection={clearSelection}
        />
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
          <OverviewTab statistics={statistics} />
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <LibraryTab
            media={media}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            toggleMediaSelection={toggleMediaSelection}
            clearSelection={clearSelection}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filters={filters}
            updateFilters={updateFilters}
            currentPage={currentPage}
            totalPages={totalPages}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="folders" className="space-y-6">
          <FoldersTab folders={folders} onSelectFolder={setSelectedFolder} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <ImportExportBar importMedia={importMedia} exportMedia={exportMedia} />

      {/* Media Details Modal */}
      {viewingMedia && (
        <MediaDetailsSection
          viewingMedia={viewingMedia}
          onClose={() => setViewingMedia(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Upload Modal */}
      {showUpload && <MediaUpload onUpload={handleUpload} onClose={() => setShowUpload(false)} />}
    </div>
  );
}
