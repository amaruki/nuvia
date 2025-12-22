"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Category, 
  CategoryFilters, 
  CategoryFormData, 
  CategoryStatistics,
  CategoryUsage,
  CategoryType,
  CategoryStatus,
  CategoryScope,
  CATEGORY_TYPES,
  CATEGORY_STATUSES,
  CATEGORY_SCOPES
} from "@/types/category.types";

// Mock data for development
const mockCategories: Category[] = [
  {
    id: "cat_1",
    name: "Technology",
    slug: "technology",
    description: "Technology-related content and discussions",
    type: "article",
    status: "active",
    scope: "global",
    color: "#3b82f6",
    icon: "cpu",
    contentCount: 45,
    lastUsed: new Date("2024-12-15"),
    order: 1,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-12-15"),
    createdBy: "admin_1"
  },
  {
    id: "cat_2",
    name: "Business",
    slug: "business",
    description: "Business and management topics",
    type: "article",
    status: "active",
    scope: "global",
    color: "#10b981",
    icon: "briefcase",
    contentCount: 32,
    lastUsed: new Date("2024-12-14"),
    order: 2,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-12-14"),
    createdBy: "admin_1"
  },
  {
    id: "cat_3",
    name: "Education",
    slug: "education",
    description: "Educational content and resources",
    type: "article",
    status: "active",
    scope: "global",
    color: "#f97316",
    icon: "graduation-cap",
    contentCount: 28,
    lastUsed: new Date("2024-12-13"),
    order: 3,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-12-13"),
    createdBy: "admin_2"
  },
  {
    id: "cat_4",
    name: "General Announcements",
    slug: "general-announcements",
    description: "General community announcements",
    type: "announcement",
    status: "active",
    scope: "global",
    color: "#ef4444",
    icon: "megaphone",
    contentCount: 15,
    lastUsed: new Date("2024-12-16"),
    order: 1,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-12-16"),
    createdBy: "admin_1"
  },
  {
    id: "cat_5",
    name: "Events",
    slug: "events",
    description: "Event-related announcements",
    type: "announcement",
    status: "active",
    scope: "global",
    color: "#8b5cf6",
    icon: "calendar",
    contentCount: 8,
    lastUsed: new Date("2024-12-12"),
    order: 2,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-12-12"),
    createdBy: "admin_2"
  },
  {
    id: "cat_6",
    name: "Chapter News",
    slug: "chapter-news",
    description: "Chapter-specific announcements",
    type: "announcement",
    status: "inactive",
    scope: "chapter",
    color: "#06b6d4",
    icon: "building",
    contentCount: 0,
    lastUsed: undefined,
    order: 3,
    allowedChapters: ["chapter_1", "chapter_2"],
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
    createdBy: "admin_1"
  }
];

const mockStatistics: CategoryStatistics = {
  totalCategories: 6,
  activeCategories: 5,
  inactiveCategories: 1,
  archivedCategories: 0,
  categoriesByType: [
    { type: "article", count: 3, contentCount: 105 },
    { type: "announcement", count: 3, contentCount: 23 }
  ],
  categoriesByScope: [
    { scope: "global", count: 5 },
    { scope: "chapter", count: 1 },
    { scope: "committee", count: 0 }
  ],
  categoriesByStatus: [
    { status: "active", count: 5 },
    { status: "inactive", count: 1 },
    { status: "archived", count: 0 }
  ],
  mostUsedCategories: [
    {
      categoryId: "cat_1",
      name: "Technology",
      contentCount: 45,
      type: "article",
      lastUsed: new Date("2024-12-15")
    },
    {
      categoryId: "cat_2",
      name: "Business",
      contentCount: 32,
      type: "article",
      lastUsed: new Date("2024-12-14")
    }
  ],
  recentlyCreated: [
    {
      id: "cat_6",
      name: "Chapter News",
      type: "announcement",
      createdBy: "admin_1",
      createdAt: new Date("2024-03-01")
    }
  ],
  orphanedCategories: [
    {
      id: "cat_6",
      name: "Chapter News",
      type: "announcement",
      lastUsed: undefined
    }
  ]
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<CategoryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>({
    sortBy: 'order',
    sortOrder: 'asc',
    page: 1,
    limit: 20
  });

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredCategories = [...mockCategories];
      
      // Apply filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCategories = filteredCategories.filter(cat =>
          cat.name.toLowerCase().includes(searchLower) ||
          cat.description?.toLowerCase().includes(searchLower) ||
          cat.slug.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.type && filters.type.length > 0) {
        filteredCategories = filteredCategories.filter(cat =>
          filters.type!.includes(cat.type)
        );
      }
      
      if (filters.status && filters.status.length > 0) {
        filteredCategories = filteredCategories.filter(cat =>
          filters.status!.includes(cat.status)
        );
      }
      
      if (filters.scope && filters.scope.length > 0) {
        filteredCategories = filteredCategories.filter(cat =>
          filters.scope!.includes(cat.scope)
        );
      }
      
      // Sort
      filteredCategories.sort((a, b) => {
        const { sortBy = 'order', sortOrder = 'asc' } = filters;
        let aValue: any = a[sortBy as keyof Category];
        let bValue: any = b[sortBy as keyof Category];
        
        if (sortBy === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
      
      setCategories(filteredCategories);
      
      // Load statistics
      setStatistics(mockStatistics);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create category
  const createCategory = useCallback(async (data: CategoryFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        contentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "current_user" // Would come from auth context
      };
      
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (id: string, data: Partial<CategoryFormData>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCategories(prev => prev.map(cat =>
        cat.id === id
          ? {
              ...cat,
              ...data,
              updatedAt: new Date(),
              updatedBy: "current_user"
            }
          : cat
      ));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk operations
  const bulkDelete = useCallback(async (ids: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCategories(prev => prev.filter(cat => !ids.includes(cat.id)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete categories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: CategoryStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCategories(prev => prev.map(cat =>
        ids.includes(cat.id)
          ? {
              ...cat,
              status,
              updatedAt: new Date(),
              updatedBy: "current_user"
            }
          : cat
      ));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update categories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter operations
  const updateFilters = useCallback((newFilters: Partial<CategoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      sortBy: 'order',
      sortOrder: 'asc',
      page: 1,
      limit: 20
    });
  }, []);

  const refreshData = useCallback(() => {
    loadCategories();
  }, [loadCategories]);

  // Export/Import
  const exportCategories = useCallback(async (format: 'json' | 'csv') => {
    try {
      const data = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        type: cat.type,
        status: cat.status,
        scope: cat.scope,
        color: cat.color,
        icon: cat.icon,
        contentCount: cat.contentCount,
        createdAt: cat.createdAt,
        createdBy: cat.createdBy
      }));
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `categories-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export would be implemented here
        console.log('CSV export not implemented yet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export categories');
    }
  }, [categories]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    // Data
    categories,
    statistics,
    loading,
    error,
    filters,
    
    // CRUD operations
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDelete,
    bulkUpdateStatus,
    
    // Filter operations
    updateFilters,
    clearFilters,
    
    // Utility operations
    refreshData,
    exportCategories,
    
    // Pagination
    currentPage: filters.page || 1,
    totalPages: Math.ceil(categories.length / (filters.limit || 20)),
    totalItems: categories.length
  };
}