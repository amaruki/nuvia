"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Chapter,
  ChapterOverallStatistics,
  ChapterFilterOptions,
  ChapterFormData,
} from "@/types/chapter.types";
import { mockChapters, mockChapterStatistics } from "@/lib/data/mock-chapter-data";
import { logger } from "@/lib/logger";

export function useChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [statistics, setStatistics] = useState<ChapterOverallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChapterFilterOptions>({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setChapters(mockChapters);
        setStatistics(mockChapterStatistics);
        setError(null);
      } catch (err) {
        setError("Failed to load chapter data");
        logger.error("Error loading chapter data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter chapters based on current filters
  const filteredChapters = chapters.filter((chapter) => {
    if (filters.status && !filters.status.includes(chapter.status)) return false;
    if (filters.region && !filters.region.includes(chapter.location.region)) return false;
    if (filters.country && !filters.country.includes(chapter.location.country)) return false;
    if (filters.memberCountRange) {
      const { min, max } = filters.memberCountRange;
      if (chapter.memberCount < min || chapter.memberCount > max) return false;
    }
    if (filters.leadershipRole && filters.leadershipRole.length > 0) {
      const hasRole = chapter.leadership.some((leader) =>
        filters.leadershipRole!.includes(leader.role),
      );
      if (!hasRole) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        chapter.displayName.toLowerCase().includes(searchLower) ||
        chapter.name.toLowerCase().includes(searchLower) ||
        chapter.location.city.toLowerCase().includes(searchLower) ||
        chapter.location.state.toLowerCase().includes(searchLower) ||
        (chapter.description && chapter.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ChapterFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      setChapters(mockChapters);
      setStatistics(mockChapterStatistics);
      setError(null);
    } catch (err) {
      setError("Failed to refresh chapter data");
      logger.error("Error refreshing chapter data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new chapter
  const addChapter = useCallback(async (chapterData: ChapterFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newChapter: Chapter = {
        id: `ch_${Date.now()}`,
        name: chapterData.name,
        displayName: chapterData.displayName,
        description: chapterData.description,
        status: chapterData.status,
        location: chapterData.location,
        leadership: [],
        memberCount: 0,
        establishedDate: new Date(),
        subChapterIds: [],
        contactInfo: chapterData.contactInfo,
        socialMedia: chapterData.socialMedia,
        metrics: {
          memberGrowthRate: 0,
          eventAttendanceRate: 0,
          financialHealth: "fair",
          engagementScore: 0,
          retentionRate: 0,
          newMembersThisMonth: 0,
          activeMembersThisMonth: 0,
          monthlyTrend: [],
        },
        events: [],
        finances: {
          totalRevenue: 0,
          totalExpenses: 0,
          netIncome: 0,
          budget: chapterData.settings.membershipDues * 10, // Initial budget estimate
          budgetUtilization: 0,
          monthlyRevenue: [],
          monthlyExpenses: [],
        },
        settings: chapterData.settings,
        parentChapterId: chapterData.parentChapterId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "current-user@example.com",
      };

      setChapters((prev) => [...prev, newChapter]);
      return newChapter;
    } catch (err) {
      setError("Failed to add chapter");
      logger.error("Error adding chapter", err);
      throw err;
    }
  }, []);

  // Update existing chapter
  const updateChapter = useCallback(async (id: string, chapterData: Partial<ChapterFormData>) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === id
            ? {
                ...chapter,
                name: chapterData.name || chapter.name,
                displayName: chapterData.displayName || chapter.displayName,
                description:
                  chapterData.description !== undefined
                    ? chapterData.description
                    : chapter.description,
                status: chapterData.status || chapter.status,
                location: chapterData.location || chapter.location,
                contactInfo: chapterData.contactInfo || chapter.contactInfo,
                socialMedia: chapterData.socialMedia || chapter.socialMedia,
                settings: chapterData.settings || chapter.settings,
                parentChapterId:
                  chapterData.parentChapterId !== undefined
                    ? chapterData.parentChapterId
                    : chapter.parentChapterId,
                updatedAt: new Date(),
                updatedBy: "current-user@example.com",
              }
            : chapter,
        ),
      );
    } catch (err) {
      setError("Failed to update chapter");
      logger.error("Error updating chapter", err);
      throw err;
    }
  }, []);

  // Delete chapter
  const deleteChapter = useCallback(async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setChapters((prev) => prev.filter((chapter) => chapter.id !== id));
    } catch (err) {
      setError("Failed to delete chapter");
      logger.error("Error deleting chapter", err);
      throw err;
    }
  }, []);

  // Toggle chapter status
  const toggleChapterStatus = useCallback(async (id: string, status: "active" | "inactive") => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === id
            ? {
                ...chapter,
                status,
                updatedAt: new Date(),
                updatedBy: "current-user@example.com",
              }
            : chapter,
        ),
      );
    } catch (err) {
      setError("Failed to toggle chapter status");
      logger.error("Error toggling chapter status", err);
      throw err;
    }
  }, []);

  // Add leadership member
  const addLeadershipMember = useCallback(async (chapterId: string, leadershipData: any) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newMember = {
        id: `lead_${Date.now()}`,
        ...leadershipData,
        startDate: new Date(),
        isActive: true,
      };

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                leadership: [...chapter.leadership, newMember],
                updatedAt: new Date(),
                updatedBy: "current-user@example.com",
              }
            : chapter,
        ),
      );
    } catch (err) {
      setError("Failed to add leadership member");
      logger.error("Error adding leadership member", err);
      throw err;
    }
  }, []);

  // Remove leadership member
  const removeLeadershipMember = useCallback(async (chapterId: string, memberId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                leadership: chapter.leadership.filter((member) => member.id !== memberId),
                updatedAt: new Date(),
                updatedBy: "current-user@example.com",
              }
            : chapter,
        ),
      );
    } catch (err) {
      setError("Failed to remove leadership member");
      logger.error("Error removing leadership member", err);
      throw err;
    }
  }, []);

  return {
    // Data
    chapters: filteredChapters,
    statistics,
    loading,
    error,
    filters,

    // Actions
    updateFilters,
    clearFilters,
    refreshData,
    addChapter,
    updateChapter,
    deleteChapter,
    toggleChapterStatus,
    addLeadershipMember,
    removeLeadershipMember,
  };
}
