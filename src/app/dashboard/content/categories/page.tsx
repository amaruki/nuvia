"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useFormSheet } from "@/components/dashboard/form-sheet";
import { useCategories } from "@/lib/hooks/use-categories";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import type { Category, CategoryFormData, CategoryStatus } from "@/types/category.types";

import { CategoriesActionBar } from "./_components/categories-action-bar";
import { CategoriesAnalyticsTab } from "./_components/categories-analytics-tab";
import { CategoryFormSheet } from "./_components/category-form";
import { CategoriesImportExportBar } from "./_components/categories-import-export-bar";
import { CategoriesListTab } from "./_components/categories-list-tab";
import { CategoriesOverviewTab } from "./_components/categories-overview-tab";
import { CategoriesSettingsTab } from "./_components/categories-settings-tab";
import { CategoriesError, CategoriesLoading } from "./_components/categories-states";

export default function ContentCategories() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tableVersion, setTableVersion] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const sheet = useFormSheet();
  const { setHeader, clearHeader } = useHeader();

  const {
    statistics,
    loading,
    error,
    refreshData,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDelete,
    bulkUpdateStatus,
    exportCategories,
    totalItems,
  } = useCategories();

  const bumpTable = () => setTableVersion((value) => value + 1);

  useEffect(() => {
    setHeader({
      title: "Categories Management",
      description: "Manage content categories, tags, and organizational structures",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    try {
      await deleteCategory(deleteTarget.id);
      bumpTable();
    } catch (error) {
      logger.error("Error deleting category", error);
    }
  };

  const handleDuplicate = async (category: Category) => {
    try {
      const duplicateData: CategoryFormData = {
        name: `${category.name} (Copy)`,
        description: category.description,
        type: category.type,
        status: category.status,
        scope: category.scope,
        color: category.color,
        icon: category.icon,
        emoji: category.emoji,
        order: category.order + 1,
        allowedRoles: category.allowedRoles,
        allowedChapters: category.allowedChapters,
        allowedCommittees: category.allowedCommittees,
        metadata: category.metadata,
      };
      await createCategory(duplicateData);
      bumpTable();
    } catch (error) {
      logger.error("Error duplicating category", error);
    }
  };

  const handleStatusChange = async (category: Category, status: CategoryStatus) => {
    try {
      await updateCategory(category.id, { status });
      bumpTable();
    } catch (error) {
      logger.error("Error changing category status", error);
    }
  };

  if (loading) return <CategoriesLoading />;

  if (error) return <CategoriesError error={error} onRetry={refreshData} />;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <CategoriesActionBar
        totalItems={totalItems}
        activeCount={statistics?.activeCategories}
        selectedCount={selectedCategories.length}
        onRefresh={refreshData}
        onAdd={() => sheet.openCreate()}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm py-2 px-2">
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm py-2 px-2">
            Settings
          </TabsTrigger>
        </TabsList>

        <CategoriesOverviewTab statistics={statistics} />
        <CategoriesListTab
          onEdit={(category) => sheet.openEdit(category.id)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          bulkDelete={bulkDelete}
          bulkUpdateStatus={bulkUpdateStatus}
          onSelectionChange={setSelectedCategories}
          version={tableVersion}
        />
        <CategoriesAnalyticsTab />
        <CategoriesSettingsTab />
      </Tabs>

      {/* Import/Export Section */}
      <CategoriesImportExportBar onExport={exportCategories} />

      {/* Delete confirmation dialog (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
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

      <CategoryFormSheet
        sheet={sheet}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onSaved={bumpTable}
      />
    </div>
  );
}
