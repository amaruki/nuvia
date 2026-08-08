"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArticlesOverviewCards } from "@/components/content/articles-overview-cards";
import { ArticlesFilters } from "@/components/content/articles-filters";
import { useArticles } from "@/lib/hooks/use-articles";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Article } from "@/types/article";
import { ActionBar } from "./_components/action-bar";
import { AnalyticsTab } from "./_components/analytics-tab";
import { ArticlesTab } from "./_components/articles-tab";
import { BulkActions } from "./_components/bulk-actions";
import { DraftsTab } from "./_components/drafts-tab";
import { ImportExportBar } from "./_components/import-export-bar";
import { OverviewTab } from "./_components/overview-tab";
import { ErrorState, LoadingState } from "./_components/page-states";

export default function ContentArticles() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    articles,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    deleteArticle,
    duplicateArticle,
    publishArticle,
    archiveArticle,
    scheduleArticle,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    exportArticles,
    importArticles,
    currentPage,
    totalPages,
    totalItems,
  } = useArticles();

  useEffect(() => {
    setHeader({
      title: "Articles Management",
      description:
        "Manage articles, tutorials, guides, and all content with comprehensive analytics and workflow controls",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleEdit = (article: Article) => {
    router.push(`/dashboard/content/articles/edit/${article.id}`);
  };

  const handleDelete = async (article: Article) => {
    if (
      confirm(`Are you sure you want to delete "${article.title}"? This action cannot be undone.`)
    ) {
      try {
        await deleteArticle(article.id);
      } catch (error) {
        logger.error("Error deleting article", error);
      }
    }
  };

  const handlePublish = async (article: Article) => {
    try {
      await publishArticle(article.id);
    } catch (error) {
      logger.error("Error publishing article", error);
    }
  };

  const handleArchive = async (article: Article) => {
    try {
      await archiveArticle(article.id);
    } catch (error) {
      logger.error("Error archiving article", error);
    }
  };

  const handleSchedule = async (article: Article, date: Date) => {
    try {
      await scheduleArticle(article.id, date);
    } catch (error) {
      logger.error("Error scheduling article", error);
    }
  };

  const handleDuplicate = async (article: Article) => {
    try {
      await duplicateArticle(article.id);
    } catch (error) {
      logger.error("Error duplicating article", error);
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
      {statistics && <ArticlesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <ActionBar
        totalItems={totalItems}
        statistics={statistics}
        selectedArticles={selectedArticles}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
        onAdd={() => router.push("/dashboard/content/articles/create")}
      />

      {/* Filters Panel */}
      {showFilters && (
        <ArticlesFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <BulkActions
          selectedArticles={selectedArticles}
          bulkPublish={bulkPublish}
          bulkArchive={bulkArchive}
          bulkDelete={bulkDelete}
          clearSelection={() => setSelectedArticles([])}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="articles" className="text-xs sm:text-sm py-2 px-2">
            Articles
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

        <TabsContent value="articles" className="space-y-6">
          <ArticlesTab
            articles={articles}
            onViewDetails={(article) => router.push(`/dashboard/content/articles/${article.id}`)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onSchedule={handleSchedule}
            selectedArticles={selectedArticles}
            onSelectionChange={setSelectedArticles}
            currentPage={currentPage}
            totalPages={totalPages}
            updateFilters={updateFilters}
          />
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <DraftsTab articles={articles} onEdit={handleEdit} onPublish={handlePublish} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab statistics={statistics} />
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <ImportExportBar exportArticles={exportArticles} importArticles={importArticles} />
    </div>
  );
}
