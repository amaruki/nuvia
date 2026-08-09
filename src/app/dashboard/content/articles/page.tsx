"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArticlesOverviewCards } from "@/components/content/articles-overview-cards";
import { useArticles } from "@/lib/hooks/use-articles";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Article } from "@/types/article";
import { ActionBar } from "./_components/action-bar";
import { AnalyticsTab } from "./_components/analytics-tab";
import { ArticlesTab } from "./_components/articles-tab";
import { DraftsTab } from "./_components/drafts-tab";
import { ImportExportBar } from "./_components/import-export-bar";
import { OverviewTab } from "./_components/overview-tab";
import { ErrorState, LoadingState } from "./_components/page-states";

export default function ContentArticles() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tableVersion, setTableVersion] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    articles,
    statistics,
    loading,
    error,
    refreshData,
    deleteArticle,
    duplicateArticle,
    publishArticle,
    archiveArticle,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    exportArticles,
    importArticles,
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

  const bumpTable = () => setTableVersion((value) => value + 1);

  const handleEdit = (article: Article) => {
    router.push(`/dashboard/content/articles/edit/${article.id}`);
  };

  const handleDelete = (article: Article) => {
    setDeleteTarget(article);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    try {
      await deleteArticle(deleteTarget.id);
      bumpTable();
    } catch (error) {
      logger.error("Error deleting article", error);
    }
  };

  const handlePublish = async (article: Article) => {
    try {
      await publishArticle(article.id);
      bumpTable();
    } catch (error) {
      logger.error("Error publishing article", error);
    }
  };

  const handleArchive = async (article: Article) => {
    try {
      await archiveArticle(article.id);
      bumpTable();
    } catch (error) {
      logger.error("Error archiving article", error);
    }
  };

  const handleDuplicate = async (article: Article) => {
    try {
      await duplicateArticle(article.id);
      bumpTable();
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
        onRefresh={refreshData}
        onAdd={() => router.push("/dashboard/content/articles/create")}
      />

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
            onViewDetails={(article) => router.push(`/dashboard/content/articles/${article.id}`)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onPublish={handlePublish}
            onArchive={handleArchive}
            bulkPublish={bulkPublish}
            bulkArchive={bulkArchive}
            bulkDelete={bulkDelete}
            onSelectionChange={setSelectedArticles}
            version={tableVersion}
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

      {/* Delete confirmation dialog (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
