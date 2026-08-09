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

import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import type { Announcement, AnnouncementFormData } from "@/types/announcement";
import type { ArticleStatus } from "@/types/article";
import { AnnouncementsFilters } from "@/components/content/announcements-filters";
import { ActionBar } from "./_components/action-bar";
import { AcknowledgmentsTab } from "./_components/acknowledgments-tab";
import { AddAnnouncementView } from "./_components/add-announcement-view";
import { AnnouncementsTab } from "./_components/announcements-tab";
import { BulkActions } from "./_components/bulk-actions";
import { DraftsTab } from "./_components/drafts-tab";
import { ImportExportBar } from "./_components/import-export-bar";
import { OverviewTab } from "./_components/overview-tab";
import { ErrorState, LoadingState } from "./_components/page-states";

export default function ContentAnnouncements() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    announcements,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
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
    router.push(`/dashboard/content/announcements/edit/${announcement.id}`);
  };

  const handleDelete = (announcement: Announcement) => {
    setDeleteTarget(announcement);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    try {
      await deleteAnnouncement(deleteTarget.id);
    } catch (error) {
      logger.error("Error deleting announcement", error);
    }
  };

  const handleStatusChange = async (announcement: Announcement, status: ArticleStatus) => {
    try {
      await updateAnnouncement(announcement.id, { status });
    } catch (error) {
      logger.error("Error changing announcement status", error);
    }
  };

  const handlePublish = async (announcement: Announcement) => {
    try {
      await publishAnnouncement(announcement.id);
    } catch (error) {
      logger.error("Error publishing announcement", error);
    }
  };

  const handleDuplicate = async (announcement: Announcement) => {
    try {
      await duplicateAnnouncement(announcement.id);
    } catch (error) {
      logger.error("Error duplicating announcement", error);
    }
  };

  const handleAddAnnouncement = async (data: AnnouncementFormData) => {
    try {
      await addAnnouncement(data);
      setShowAddForm(false);
    } catch (error) {
      logger.error("Error adding announcement", error);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  if (showAddForm) {
    return (
      <AddAnnouncementView
        onSubmit={handleAddAnnouncement}
        onCancel={() => setShowAddForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <ActionBar
        totalItems={totalItems}
        statistics={statistics}
        selectedCount={selectedAnnouncements.length}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
        onAdd={() => setShowAddForm(true)}
      />

      {/* Filters Panel */}
      {showFilters && (
        <AnnouncementsFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={clearFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedAnnouncements.length > 0 && (
        <BulkActions
          selectedAnnouncements={selectedAnnouncements}
          bulkPublish={bulkPublish}
          bulkArchive={bulkArchive}
          bulkDelete={bulkDelete}
          clearSelection={() => setSelectedAnnouncements([])}
        />
      )}

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
            announcements={announcements}
            onView={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onStatusChange={handleStatusChange}
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
    </div>
  );
}
