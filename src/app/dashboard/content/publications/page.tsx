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

import { usePublications } from "@/lib/hooks/use-publications";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Publication } from "@/types/publication";
import { PublicationsOverviewCards } from "@/components/content/publications-overview-cards";
import { PageErrorState, PageLoadingState } from "@/components/dashboard/page-states";
import { useFormSheet } from "@/components/dashboard/form-sheet";
import { ActionBar } from "./_components/action-bar";
import { AnalyticsTab } from "./_components/analytics-tab";
import { DraftsTab } from "./_components/drafts-tab";
import { ImportExportBar } from "./_components/import-export-bar";
import { OverviewTab } from "./_components/overview-tab";
import { PublicationFormSheet } from "./_components/publication-form-sheet";
import { PublicationsTab } from "./_components/publications-tab";

export default function ContentPublications() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tableVersion, setTableVersion] = useState(0);
  const [selectedPublications, setSelectedPublications] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Publication | null>(null);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const sheet = useFormSheet();

  const {
    publications,
    statistics,
    loading,
    error,
    refreshData,
    addPublication,
    updatePublication,
    deletePublication,
    duplicatePublication,
    publishPublication,
    archivePublication,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    exportPublications,
    importPublications,
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

  const bumpTable = () => setTableVersion((value) => value + 1);

  const handleViewDetails = (publication: Publication) => {
    router.push(`/dashboard/content/publications/${publication.id}`);
  };

  const handleEdit = (publication: Publication) => {
    sheet.openEdit(publication.id);
  };

  const handleDelete = (publication: Publication) => {
    setDeleteTarget(publication);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    try {
      await deletePublication(deleteTarget.id);
      bumpTable();
    } catch (error) {
      logger.error("Error deleting publication", error);
    }
  };

  const handlePublish = async (publication: Publication) => {
    try {
      await publishPublication(publication.id);
      bumpTable();
    } catch (error) {
      logger.error("Error publishing publication", error);
    }
  };

  const handleArchive = async (publication: Publication) => {
    try {
      await archivePublication(publication.id);
      bumpTable();
    } catch (error) {
      logger.error("Error archiving publication", error);
    }
  };

  const handleDuplicate = async (publication: Publication) => {
    try {
      await duplicatePublication(publication.id);
      bumpTable();
    } catch (error) {
      logger.error("Error duplicating publication", error);
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
      {/* Statistics Overview */}
      {statistics && <PublicationsOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <ActionBar
        totalItems={totalItems}
        publishedCount={statistics?.publishedPublications ?? null}
        selectedPublications={selectedPublications}
        onRefresh={refreshData}
        onAdd={() => sheet.openCreate()}
      />

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
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onPublish={handlePublish}
            onArchive={handleArchive}
            bulkPublish={bulkPublish}
            bulkArchive={bulkArchive}
            bulkDelete={bulkDelete}
            onSelectionChange={setSelectedPublications}
            version={tableVersion}
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

      {/* Delete confirmation dialog (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete publication?</AlertDialogTitle>
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

      <PublicationFormSheet
        sheet={sheet}
        onCreate={addPublication}
        onUpdate={updatePublication}
        onSaved={bumpTable}
      />
    </div>
  );
}
