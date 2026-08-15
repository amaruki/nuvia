"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { useFormSheet } from "@/components/dashboard/form-sheet";
import { ChaptersOverviewCards } from "@/components/chapters/chapters-overview-cards";
import { PageErrorState, PageLoadingState } from "@/components/dashboard/page-states";
import { useChapters } from "@/lib/hooks/use-chapters";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import type { Chapter } from "@/types/chapter.types";
import { ActionBar } from "./_components/action-bar";
import { ChapterFormSheet } from "./_components/chapter-form";
import { AnalyticsTab } from "./_components/analytics-tab";
import { ChaptersTab } from "./_components/chapters-tab";
import { LeadershipTab } from "./_components/leadership-tab";
import { OverviewTab } from "./_components/overview-tab";

export default function OrganizationChapters() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const sheet = useFormSheet();
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    chapters,
    statistics,
    loading,
    error,
    refreshData,
    addChapter,
    updateChapter,
    deleteChapter,
    toggleChapterStatus,
  } = useChapters();

  // The Chapters tab owns its own paginated query; write actions here only
  // touch the hook's local cache, so the list query must be invalidated.
  const invalidateChaptersList = () => {
    void queryClient.invalidateQueries({ queryKey: ["chapters", "list"] });
  };

  useEffect(() => {
    setHeader({
      title: "Chapters Management",
      description:
        "Manage geographic and regional organizational structure, chapter leadership, and performance metrics",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleDelete = (chapter: Chapter) => {
    setChapterToDelete(chapter);
  };

  const confirmDeleteChapter = async () => {
    if (!chapterToDelete) return;
    try {
      setIsDeletingChapter(true);
      await deleteChapter(chapterToDelete.id);
      setChapterToDelete(null);
      invalidateChaptersList();
    } catch (error) {
      logger.error("Error deleting chapter", error);
    } finally {
      setIsDeletingChapter(false);
    }
  };

  const handleToggleStatus = async (chapter: Chapter, status: "active" | "inactive") => {
    try {
      setIsToggling(true);
      await toggleChapterStatus(chapter.id, status);
      invalidateChaptersList();
    } catch (error) {
      logger.error("Error toggling chapter status", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleRefresh = () => {
    void refreshData();
    invalidateChaptersList();
  };

  if (loading) {
    return <PageLoadingState />;
  }

  if (error) {
    return <PageErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <ChaptersOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <ActionBar
        totalChapters={chapters.length}
        statistics={statistics}
        onRefresh={handleRefresh}
        onAdd={() => sheet.openCreate()}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="chapters" className="text-xs sm:text-sm py-2 px-2">
            Chapters
          </TabsTrigger>
          <TabsTrigger value="leadership" className="text-xs sm:text-sm py-2 px-2">
            Leadership
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab chapters={chapters} statistics={statistics} />
        </TabsContent>

        <TabsContent value="chapters" className="space-y-6">
          <ChaptersTab
            isToggling={isToggling}
            onViewDetails={(chapter) =>
              router.push(`/dashboard/organization/chapters/${chapter.id}`)
            }
            onEdit={(chapter) => sheet.openEdit(chapter.id)}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </TabsContent>

        <TabsContent value="leadership" className="space-y-6">
          <LeadershipTab chapters={chapters} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab statistics={statistics} />
        </TabsContent>
      </Tabs>

      <ChapterFormSheet
        sheet={sheet}
        chapters={chapters}
        onCreate={addChapter}
        onUpdate={updateChapter}
        onSaved={invalidateChaptersList}
      />

      <AlertDialog
        open={chapterToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingChapter) setChapterToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{chapterToDelete?.displayName}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingChapter}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeletingChapter || !chapterToDelete}
              onClick={confirmDeleteChapter}
            >
              {isDeletingChapter ? "Deleting..." : "Delete chapter"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
