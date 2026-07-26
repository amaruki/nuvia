"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Plus,
  Folder,
  Settings,
  Filter,
  Eye,
  BarChart3,
  Archive,
  Trash2,
  Grid3X3,
  List,
  Search,
} from "lucide-react";

import { CategoryCard } from "@/components/content/category-card";
import { CategoriesFilters } from "@/components/content/categories-filters";
import {
  CategoriesOverviewCards,
  CategoriesBreakdown,
  CategoriesStatusBreakdown,
  MostUsedCategories,
} from "@/components/content/categories-overview-cards";
import { AddCategoryForm } from "@/components/content/add-category-form";
import { useCategories } from "@/lib/hooks/use-categories";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Category, CategoryFormData, CategoryStatus } from "@/types/category.types";

export default function ContentCategories() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const router = useRouter();
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
    currentPage,
    totalPages,
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

  const handleViewDetails = (category: Category) => {
    setViewingCategory(category);
    // In a real app, this might navigate to a details page
    logger.info("View category details", category);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowAddForm(true);
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

  const handleAdd = () => {
    setEditingCategory(null);
    setShowAddForm(true);
  };

  const handleAddCategory = async (data: CategoryFormData) => {
    try {
      await createCategory(data);
      setShowAddForm(false);
      setEditingCategory(null);
    } catch (error) {
      logger.error("Error adding category", error);
    }
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, data);
      setShowAddForm(false);
      setEditingCategory(null);
    } catch (error) {
      logger.error("Error updating category", error);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedCategories.length === 0) return;

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
    if (selectedCategories.length === 0) return;

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
    if (selectedCategories.length === 0) return;

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

  const handleExport = (format: "csv" | "json") => {
    exportCategories(format);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-2"></div>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingCategory ? "Edit Category" : "Create New Category"}
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(false);
              setEditingCategory(null);
            }}
          >
            Cancel
          </Button>
        </div>
        <AddCategoryForm
          onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
          onCancel={() => {
            setShowAddForm(false);
            setEditingCategory(null);
          }}
          editingCategory={editingCategory || undefined}
          isLoading={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {totalItems} categories total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.activeCategories} active
            </Badge>
          )}
          {selectedCategories.length > 0 && (
            <Badge variant="default" className="text-sm">
              {selectedCategories.length} selected
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Category</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

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
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
          <span className="text-sm font-medium">Bulk Actions:</span>
          <Button variant="outline" size="sm" onClick={handleBulkPublish}>
            <Folder className="mr-2 h-4 w-4" />
            Activate ({selectedCategories.length})
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive ({selectedCategories.length})
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedCategories.length})
          </Button>
        </div>
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

        <TabsContent value="overview" className="space-y-6">
          {statistics && (
            <>
              <CategoriesOverviewCards statistics={statistics} />
              <div className="grid gap-6 md:grid-cols-2">
                <CategoriesBreakdown statistics={statistics} />
                <CategoriesStatusBreakdown statistics={statistics} />
              </div>
              {statistics.mostUsedCategories && statistics.mostUsedCategories.length > 0 && (
                <MostUsedCategories categories={statistics.mostUsedCategories} />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onView={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onStatusChange={handleStatusChange}
                selected={selectedCategories.includes(category.id)}
                onSelect={(category, selected) => {
                  if (selected) {
                    setSelectedCategories([...selectedCategories, category.id]);
                  } else {
                    setSelectedCategories(selectedCategories.filter((id) => id !== category.id));
                  }
                }}
              />
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-sm">
                Try adjusting your filters or create a new category to get started.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Category analytics will appear here</p>
            <p className="text-sm mt-2">Detailed usage statistics and trends coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Category management settings</p>
            <p className="text-sm mt-2">Global settings and configuration options</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
        <span className="text-sm font-medium">Import/Export:</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
