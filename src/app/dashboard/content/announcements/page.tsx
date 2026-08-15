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
import { PageErrorState, PageLoadingState } from "@/components/dashboard/page-states";
import { useFormSheet } from "@/components/dashboard/form-sheet";

import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import type { Announcement } from "@/types/announcement";
import type { ArticleStatus } from "@/types/article";
import { ActionBar } from "./_components/action-bar";
import { AcknowledgmentsTab } from "./_components/acknowledgments-tab";
import { AnnouncementFormSheet } from "./_components/announcement-form-sheet";
import { AnnouncementsTab } from "./_components/announcements-tab";
import { DraftsTab } from "./_components/drafts-tab";
import { ImportExportBar } from "./_components/import-export-bar";
import { OverviewTab } from "./_components/overview-tab";

export default function ContentAnnouncements() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tableVersion, setTableVersion] = useState(0);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const sheet = useFormSheet();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    announcements,
    statistics,
    loading,
    error,
    refreshData,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    duplicateAnnouncement,
    publishAnnouncement,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    exportAnnouncements,
    importAnnouncements,
    totalItems,
  } = useAnnouncements();

  const bumpTable = () => setTableVersion((value) => value + 1);

  useEffect(() => {
    setHeader({
      title: "Announcements Management",
      description:
        "Manage announcements, notifications, and important updates with comprehensive targeting",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (announcement: Announcement) => {
    router.push(`/dashboard/content/announcements/${announcement.id}`);
  };

  const handleEdit = (announcement: Announcement) => {
    sheet.openEdit(announcement.id);
  };

  const handleDelete = (announcement: Announcement) => {
    setDeleteTarget(announcement);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    try {
      await deleteAnnouncement(deleteTarget.id);
      bumpTable();
    } catch (error) {
      logger.error("Error deleting announcement", error);
    }
  };

  const handleStatusChange = async (announcement: Announcement, status: ArticleStatus) => {
    try {
      await updateAnnouncement(announcement.id, { status });
      bumpTable();
    } catch (error) {
      logger.error("Error changing announcement status", error);
    }
  };

  const handlePublish = async (announcement: Announcement) => {
    try {
      await publishAnnouncement(announcement.id);
      bumpTable();
    } catch (error) {
      logger.error("Error publishing announcement", error);
    }
  };

  const handleDuplicate = async (announcement: Announcement) => {
    try {
      await duplicateAnnouncement(announcement.id);
      bumpTable();
    } catch (error) {
      logger.error("Error duplicating announcement", error);
    }
  };

  if (loading) {
    return <PageLoadingState />;
  }

  if (error) {
    return <PageErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <ActionBar
        totalItems={totalItems}
        statistics={statistics}
        selectedCount={selectedAnnouncements.length}
        onRefresh={refreshData}
        onAdd={() => sheet.openCreate()}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs sm:text-sm py-2 px-2">
            Announcements
          </TabsTrigger>
          <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2 px-2">
            Drafts
          </TabsTrigger>
          <TabsTrigger value="acknowledgments" className="text-xs sm:text-sm py-2 px-2">
            Acknowledgments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab statistics={statistics} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <AnnouncementsTab
            onView={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onStatusChange={handleStatusChange}
            bulkPublish={bulkPublish}
            bulkArchive={bulkArchive}
            bulkDelete={bulkDelete}
            onSelectionChange={setSelectedAnnouncements}
            version={tableVersion}
          />
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <DraftsTab announcements={announcements} onEdit={handleEdit} onPublish={handlePublish} />
        </TabsContent>

        <TabsContent value="acknowledgments" className="space-y-6">
          <AcknowledgmentsTab />
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <ImportExportBar
        importAnnouncements={importAnnouncements}
        exportAnnouncements={exportAnnouncements}
      />

      {/* Delete confirmation dialog (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
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

      <AnnouncementFormSheet
        sheet={sheet}
        onCreate={addAnnouncement}
        onUpdate={updateAnnouncement}
        onSaved={bumpTable}
      />
    </div>
  );
}
