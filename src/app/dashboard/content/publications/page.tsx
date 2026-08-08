"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { usePublications } from "@/lib/hooks/use-publications";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Publication } from "@/types/publication.types";
import { PublicationsOverviewCards } from "@/components/content/publications-overview-cards";
import { PublicationsFilters } from "@/components/content/publications-filters";
import { ActionBar } from "./_components/action-bar";
import { AnalyticsTab } from "./_components/analytics-tab";
import { BulkActions } from "./_components/bulk-actions";
import { DraftsTab } from "./_components/drafts-tab";
import { ImportExportBar } from "./_components/import-export-bar";
import { OverviewTab } from "./_components/overview-tab";
import { ErrorState, LoadingState } from "./_components/page-states";
import { PublicationsTab } from "./_components/publications-tab";

export default function ContentPublications() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPublications, setSelectedPublications] = useState<string[]>([]);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    publications,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    deletePublication,
    duplicatePublication,
    publishPublication,
    archivePublication,
    schedulePublication,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    exportPublications,
    importPublications,
    currentPage,
    totalPages,
    totalItems,
  } = usePublications();

  useEffect(() => {
    setHeader({
      title: "Publications Management",
      description:
        "Manage articles, blogs, newsletters, and all content publications with comprehensive analytics and workflow controls",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (publication: Publication) => {
    router.push(`/dashboard/content/publications/${publication.id}`);
  };

  const handleEdit = (publication: Publication) => {
    router.push(`/dashboard/content/publications/edit/${publication.id}`);
  };

  const handleAdd = () => {
    router.push(`/dashboard/content/publications/create`);
  };

  const handleDelete = async (publication: Publication) => {
    if (
      confirm(
        `Are you sure you want to delete "${publication.title}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deletePublication(publication.id);
      } catch (error) {
        logger.error("Error deleting publication", error);
      }
    }
  };

  const handlePublish = async (publication: Publication) => {
    try {
      await publishPublication(publication.id);
    } catch (error) {
      logger.error("Error publishing publication", error);
    }
  };

  const handleArchive = async (publication: Publication) => {
    try {
      await archivePublication(publication.id);
    } catch (error) {
      logger.error("Error archiving publication", error);
    }
  };

  const handleSchedule = async (publication: Publication, date: Date) => {
    try {
      await schedulePublication(publication.id, date);
    } catch (error) {
      logger.error("Error scheduling publication", error);
    }
  };

  const handleDuplicate = async (publication: Publication) => {
    try {
      await duplicatePublication(publication.id);
    } catch (error) {
      logger.error("Error duplicating publication", error);
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
      {statistics && <PublicationsOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <ActionBar
        totalItems={totalItems}
        publishedCount={statistics?.publishedPublications ?? null}
        selectedPublications={selectedPublications}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
        onAdd={handleAdd}
      />

      {/* Filters Panel */}
      {showFilters && (
        <PublicationsFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedPublications.length > 0 && (
        <BulkActions
          selectedPublications={selectedPublications}
          bulkPublish={bulkPublish}
          bulkArchive={bulkArchive}
          bulkDelete={bulkDelete}
          clearSelection={() => setSelectedPublications([])}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="publications" className="text-xs sm:text-sm py-2 px-2">
            Publications
          </TabsTrigger>
          <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2 px-2">
            Drafts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab statistics={statistics} />
        </TabsContent>

        <TabsContent value="publications" className="space-y-6">
          <PublicationsTab
            publications={publications}
            selectedPublications={selectedPublications}
            onSelectionChange={setSelectedPublications}
            currentPage={currentPage}
            totalPages={totalPages}
            updateFilters={updateFilters}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onSchedule={handleSchedule}
          />
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <DraftsTab publications={publications} onEdit={handleEdit} onPublish={handlePublish} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab statistics={statistics} />
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <ImportExportBar
        importPublications={importPublications}
        exportPublications={exportPublications}
      />
    </div>
  );
}
