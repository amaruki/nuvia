"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CategoriesFilters } from "@/components/content/categories-filters";
import { useCategories } from "@/lib/hooks/use-categories";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import type { Category, CategoryFormData, CategoryStatus } from "@/types/category.types";

import { CategoriesActionBar } from "./_components/categories-action-bar";
import { CategoriesAnalyticsTab } from "./_components/categories-analytics-tab";
import { CategoriesBulkActions } from "./_components/categories-bulk-actions";
import { CategoriesFormView } from "./_components/categories-form-view";
import { CategoriesImportExportBar } from "./_components/categories-import-export-bar";
import { CategoriesListTab } from "./_components/categories-list-tab";
import { CategoriesOverviewTab } from "./_components/categories-overview-tab";
import { CategoriesSettingsTab } from "./_components/categories-settings-tab";
import { CategoriesError, CategoriesLoading } from "./_components/categories-states";

export default function ContentCategories() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { setHeader, clearHeader } = useHeader();

  const {
    categories,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDelete,
    bulkUpdateStatus,
    exportCategories,
    totalItems,
  } = useCategories();

  useEffect(() => {
    setHeader({
      title: "Categories Management",
      description: "Manage content categories, tags, and organizational structures",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const closeForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
  };

  const openForm = (category: Category | null) => {
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      closeForm();
    } catch (error) {
      logger.error(editingCategory ? "Error updating category" : "Error adding category", error);
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)
    ) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        logger.error("Error deleting category", error);
      }
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
    } catch (error) {
      logger.error("Error duplicating category", error);
    }
  };

  const handleStatusChange = async (category: Category, status: CategoryStatus) => {
    try {
      await updateCategory(category.id, { status });
    } catch (error) {
      logger.error("Error changing category status", error);
    }
  };

  const handleToggleSelect = (category: Category, selected: boolean) => {
    if (selected) {
      setSelectedCategories([...selectedCategories, category.id]);
    } else {
      setSelectedCategories(selectedCategories.filter((id) => id !== category.id));
    }
  };

  const handleBulkPublish = async () => {
    if (
      confirm(`Are you sure you want to activate ${selectedCategories.length} selected categories?`)
    ) {
      try {
        await bulkUpdateStatus(selectedCategories, "active");
        setSelectedCategories([]);
      } catch (error) {
        logger.error("Error bulk activating categories", error);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (
      confirm(`Are you sure you want to archive ${selectedCategories.length} selected categories?`)
    ) {
      try {
        await bulkUpdateStatus(selectedCategories, "archived");
        setSelectedCategories([]);
      } catch (error) {
        logger.error("Error bulk archiving categories", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedCategories.length} selected categories? This action cannot be undone.`,
      )
    ) {
      try {
        await bulkDelete(selectedCategories);
        setSelectedCategories([]);
      } catch (error) {
        logger.error("Error bulk deleting categories", error);
      }
    }
  };

  if (loading) return <CategoriesLoading />;

  if (error) return <CategoriesError error={error} onRetry={refreshData} />;

  if (showAddForm) {
    return (
      <CategoriesFormView
        editingCategory={editingCategory}
        isLoading={loading}
        onSubmit={handleFormSubmit}
        onCancel={closeForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <CategoriesActionBar
        totalItems={totalItems}
        activeCount={statistics?.activeCategories}
        selectedCount={selectedCategories.length}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
        onAdd={() => openForm(null)}
      />

      {/* Filters Panel */}
      {showFilters && (
        <CategoriesFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={clearFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedCategories.length > 0 && (
        <CategoriesBulkActions
          selectedCount={selectedCategories.length}
          onActivate={handleBulkPublish}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
        />
      )}

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
          categories={categories}
          selectedIds={selectedCategories}
          onView={(category) => logger.info("View category details", category)}
          onEdit={openForm}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onStatusChange={handleStatusChange}
          onToggleSelect={handleToggleSelect}
        />
        <CategoriesAnalyticsTab />
        <CategoriesSettingsTab />
      </Tabs>

      {/* Import/Export Section */}
      <CategoriesImportExportBar onExport={exportCategories} />
    </div>
  );
}
