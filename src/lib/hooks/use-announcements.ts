"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Announcement,
  AnnouncementStatistics,
  AnnouncementFilters,
  AnnouncementFormData,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES
} from "@/types/announcement.types";
import { ArticleStatus } from "@/types/article.types";
import { mockArticles, mockStatistics, mockAnnouncements } from "@/lib/data/mock-article-data";

interface UseAnnouncementsReturn {
  // Data
  announcements: Announcement[];
  statistics: AnnouncementStatistics | null;
  filteredAnnouncements: Announcement[];
  
  // State
  loading: boolean;
  error: string | null;
  filters: AnnouncementFilters;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  
  // Actions
  refreshData: () => void;
  updateFilters: (filters: Partial<AnnouncementFilters>) => void;
  clearFilters: () => void;
  
  // CRUD operations
  getAnnouncement: (id: string) => Announcement | null;
  addAnnouncement: (data: AnnouncementFormData) => Promise<Announcement>;
  updateAnnouncement: (id: string, data: Partial<AnnouncementFormData>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  duplicateAnnouncement: (id: string) => Promise<Announcement>;
  
  // Status management
  publishAnnouncement: (id: string) => Promise<void>;
  archiveAnnouncement: (id: string) => Promise<void>;
  scheduleAnnouncement: (id: string, date: Date) => Promise<void>;
  unpublishAnnouncement: (id: string) => Promise<void>;
  reviewAnnouncement: (id: string, reviewerId: string) => Promise<void>;
  
  // Bulk operations
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkReview: (ids: string[], reviewerId: string) => Promise<void>;
  
  // Utility
  exportAnnouncements: (format: 'csv' | 'json' | 'pdf') => void;
  importAnnouncements: (file: File) => Promise<void>;
}

const DEFAULT_FILTERS: AnnouncementFilters = {
  search: "",
  status: [],
  type: [],
  category: ['announcements'], // Always announcements
  priority: [],
  targetAudience: [],
  targetChapters: [],
  targetCommittees: [],
  author: [],
  tags: [],
  series: [],
  dateRange: undefined,
  expiresAt: undefined,
  visibility: [],
  isPinned: undefined,
  isUrgent: undefined,
  requiresAcknowledgment: undefined,
  hasExpiration: undefined,
  sendEmailNotification: undefined,
  sendPushNotification: undefined,
  displayOnHomepage: undefined,
  displayInDashboard: undefined,
  minAcknowledgmentRate: undefined,
  maxAcknowledgmentRate: undefined,
  sortBy: "title",
  sortOrder: "desc",
  page: 1,
  limit: 10
};

const ITEMS_PER_PAGE = 10;

// Convert article to announcement
const convertArticleToAnnouncement = (article: any): Announcement => {
  return {
    ...article,
    type: article.type || 'general', // Default to general if not specified
    category: 'announcements',
    priority: article.priority || 'medium',
    targetAudience: article.targetAudience || 'all_members',
    targetChapters: article.targetChapters || [],
    targetCommittees: article.targetCommittees || [],
    expiresAt: article.expiresAt,
    isPinned: article.isPinned || false,
    isUrgent: article.isUrgent || false,
    requiresAcknowledgment: article.requiresAcknowledgment || false,
    acknowledgmentCount: article.acknowledgmentCount || 0,
    sendEmailNotification: article.sendEmailNotification || true,
    sendPushNotification: article.sendPushNotification || true,
    displayOnHomepage: article.displayOnHomepage || false,
    displayInDashboard: article.displayInDashboard || true
  };
};

// Convert article statistics to announcement statistics
const convertArticleStatisticsToAnnouncementStatistics = (articleStats: any): AnnouncementStatistics => {
  const announcements = mockAnnouncements.map(convertArticleToAnnouncement);
  
  return {
    ...articleStats,
    totalArticles: announcements.length,
    publishedArticles: announcements.filter(a => a.status === 'published').length,
    draftArticles: announcements.filter(a => a.status === 'draft').length,
    scheduledArticles: announcements.filter(a => a.status === 'scheduled').length,
    archivedArticles: announcements.filter(a => a.status === 'archived').length,
    
    // Announcement-specific statistics
    announcementsByType: ANNOUNCEMENT_TYPES.map(type => ({
      type,
      count: announcements.filter(a => a.type === type).length
    })),
    
    announcementsByPriority: ANNOUNCEMENT_PRIORITIES.map(priority => ({
      priority,
      count: announcements.filter(a => a.priority === priority).length
    })),
    
    announcementsByTargetAudience: ANNOUNCEMENT_TARGET_AUDIENCES.map(targetAudience => ({
      targetAudience,
      count: announcements.filter(a => a.targetAudience === targetAudience).length
    })),
    
    // Additional announcement-specific metrics
    totalAcknowledgments: announcements.reduce((sum, a) => sum + (a.acknowledgmentCount || 0), 0),
    averageAcknowledgmentRate: announcements.length > 0
      ? Math.round(announcements.reduce((sum, a) => sum + (a.acknowledgmentCount || 0), 0) / announcements.length)
      : 0,
    urgentAnnouncements: announcements.filter(a => a.isUrgent).length,
    pinnedAnnouncements: announcements.filter(a => a.isPinned).length,
    expiredAnnouncements: announcements.filter(a => a.expiresAt && a.expiresAt < new Date()).length,
    activeAnnouncements: announcements.filter(a =>
      a.status === 'published' && (!a.expiresAt || a.expiresAt >= new Date())
    ).length
  };
};

export function useAnnouncements(): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [statistics, setStatistics] = useState<AnnouncementStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnnouncementFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Use mock announcements directly and convert to announcement type
        const announcementArticles = mockAnnouncements.map(convertArticleToAnnouncement);
        
        setAnnouncements(announcementArticles);
        setStatistics(convertArticleStatisticsToAnnouncementStatistics(mockStatistics));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter and sort announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(announcement => 
        announcement.title.toLowerCase().includes(searchLower) ||
        announcement.excerpt.toLowerCase().includes(searchLower) ||
        announcement.content.toLowerCase().includes(searchLower) ||
        announcement.author.name.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(announcement => filters.status!.includes(announcement.status));
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(announcement => filters.type!.includes(announcement.type));
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(announcement => filters.priority!.includes(announcement.priority));
    }

    // Target audience filter
    if (filters.targetAudience && filters.targetAudience.length > 0) {
      filtered = filtered.filter(announcement => filters.targetAudience!.includes(announcement.targetAudience));
    }

    // Target chapters filter
    if (filters.targetChapters && filters.targetChapters.length > 0) {
      filtered = filtered.filter(announcement => 
        announcement.targetChapters?.some(chapter => filters.targetChapters!.includes(chapter))
      );
    }

    // Target committees filter
    if (filters.targetCommittees && filters.targetCommittees.length > 0) {
      filtered = filtered.filter(announcement => 
        announcement.targetCommittees?.some(committee => filters.targetCommittees!.includes(committee))
      );
    }

    // Author filter
    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(announcement => 
        filters.author!.includes(announcement.author.id) ||
        announcement.coAuthors?.some(coAuthor => filters.author!.includes(coAuthor.id))
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(announcement =>
        announcement.tags.some(tag => filters.tags!.includes(tag.id))
      );
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(announcement => {
        const announcementDate = announcement.publishedAt || announcement.scheduledFor || announcement.lastModified;
        return announcementDate >= filters.dateRange!.start && announcementDate <= filters.dateRange!.end;
      });
    }

    // Expiration date filter
    if (filters.expiresAt) {
      filtered = filtered.filter(announcement => {
        if (!announcement.expiresAt) return false;
        if (filters.expiresAt!.start && announcement.expiresAt < filters.expiresAt!.start) return false;
        if (filters.expiresAt!.end && announcement.expiresAt > filters.expiresAt!.end) return false;
        return true;
      });
    }

    // Visibility filter
    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter(announcement => filters.visibility!.includes(announcement.visibility));
    }

    // Boolean filters
    if (filters.isPinned !== undefined) {
      filtered = filtered.filter(announcement => announcement.isPinned === filters.isPinned);
    }

    if (filters.isUrgent !== undefined) {
      filtered = filtered.filter(announcement => announcement.isUrgent === filters.isUrgent);
    }

    if (filters.requiresAcknowledgment !== undefined) {
      filtered = filtered.filter(announcement => announcement.requiresAcknowledgment === filters.requiresAcknowledgment);
    }

    if (filters.hasExpiration !== undefined) {
      filtered = filtered.filter(announcement => !!announcement.expiresAt === filters.hasExpiration);
    }

    if (filters.sendEmailNotification !== undefined) {
      filtered = filtered.filter(announcement => announcement.sendEmailNotification === filters.sendEmailNotification);
    }

    if (filters.sendPushNotification !== undefined) {
      filtered = filtered.filter(announcement => announcement.sendPushNotification === filters.sendPushNotification);
    }

    if (filters.displayOnHomepage !== undefined) {
      filtered = filtered.filter(announcement => announcement.displayOnHomepage === filters.displayOnHomepage);
    }

    if (filters.displayInDashboard !== undefined) {
      filtered = filtered.filter(announcement => announcement.displayInDashboard === filters.displayInDashboard);
    }

    // Acknowledgment rate filter
    if (filters.minAcknowledgmentRate !== undefined) {
      filtered = filtered.filter(announcement => {
        const rate = announcement.acknowledgmentCount && announcement.acknowledgmentCount > 0
          ? 100 // Default to 100% if there are acknowledgments
          : 0;
        return rate >= filters.minAcknowledgmentRate!;
      });
    }

    if (filters.maxAcknowledgmentRate !== undefined) {
      filtered = filtered.filter(announcement => {
        const rate = announcement.acknowledgmentCount && announcement.acknowledgmentCount > 0
          ? 100 // Default to 100% if there are acknowledgments
          : 0;
        return rate <= filters.maxAcknowledgmentRate!;
      });
    }

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'publishedAt':
            aValue = a.publishedAt || a.scheduledFor || a.lastModified;
            bValue = b.publishedAt || b.scheduledFor || b.lastModified;
            break;
          case 'author':
            aValue = a.author.name.toLowerCase();
            bValue = b.author.name.toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [announcements, filters]);

  // Pagination
  const { totalPages, totalItems, itemsPerPage } = useMemo(() => {
    const total = filteredAnnouncements.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    
    return {
      totalPages: pages,
      totalItems: total,
      itemsPerPage: ITEMS_PER_PAGE
    };
  }, [filteredAnnouncements]);

  // Paginated announcements
  const paginatedAnnouncements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAnnouncements.slice(startIndex, endIndex);
  }, [filteredAnnouncements, currentPage, itemsPerPage]);

  // Actions
  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API refresh
    setTimeout(() => {
      const announcementArticles = mockAnnouncements.map(convertArticleToAnnouncement);
      
      setAnnouncements(announcementArticles);
      setStatistics(convertArticleStatisticsToAnnouncementStatistics(mockStatistics));
      setLoading(false);
    }, 500);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<AnnouncementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // Get single announcement
  const getAnnouncement = useCallback((id: string): Announcement | null => {
    return announcements.find(announcement => announcement.id === id) || null;
  }, [announcements]);

  // CRUD operations
  const addAnnouncement = useCallback(async (data: AnnouncementFormData): Promise<Announcement> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newAnnouncement: Announcement = {
        id: `announcement_${Date.now()}`,
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: data.excerpt,
        content: data.content,
        type: data.type,
        category: 'announcements',
        status: data.status,
        author: mockArticles.find(a => a.author.id === data.authorId)?.author || mockArticles[0].author,
        coAuthors: data.coAuthorIds?.map(id =>
          mockArticles.find(a => a.author.id === id)?.author
        ).filter((author): author is any => author !== undefined),
        reviewer: data.reviewerId ? 
          mockArticles.find(a => a.author.id === data.reviewerId)?.author : undefined,
        tags: mockArticles[0].tags.filter(tag => data.tagIds.includes(tag.id)),
        publishedAt: data.status === 'published' ? new Date() : undefined,
        scheduledFor: data.status === 'scheduled' ? data.scheduledFor : undefined,
        lastModified: new Date(),
        readTime: Math.ceil(data.content.split(' ').length / 200), // Rough estimate
        wordCount: data.content.split(' ').length,
        estimatedReadingSpeed: 200,
        seo: data.seo || {
          title: data.title,
          description: data.excerpt,
          keywords: [],
          ogImage: data.featuredImage,
          canonicalUrl: undefined
        },
        visibility: data.visibility,
        version: 1,
        language: 'en',
        commentsEnabled: data.commentsEnabled,
        sharingEnabled: data.sharingEnabled,
        downloadEnabled: data.downloadEnabled,
        isFeatured: data.isFeatured,
        isPinned: data.isPinned,
        priority: data.priority,
        targetAudience: data.targetAudience,
        targetChapters: data.targetChapters,
        targetCommittees: data.targetCommittees,
        expiresAt: data.expiresAt,
        isUrgent: data.isUrgent,
        requiresAcknowledgment: data.requiresAcknowledgment,
        acknowledgmentCount: 0,
        sendEmailNotification: data.sendEmailNotification,
        sendPushNotification: data.sendPushNotification,
        displayOnHomepage: data.displayOnHomepage,
        displayInDashboard: data.displayInDashboard
      };

      setAnnouncements(prev => [newAnnouncement, ...prev]);
      return newAnnouncement;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create announcement");
    }
  }, []);

  const updateAnnouncement = useCallback(async (id: string, data: Partial<AnnouncementFormData>): Promise<Announcement> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAnnouncements(prev => prev.map(announcement => {
        if (announcement.id === id) {
          return {
            ...announcement,
            ...data,
            lastModified: new Date(),
            publishedAt: data.status === 'published' && announcement.status !== 'published' ? new Date() : announcement.publishedAt,
            scheduledFor: data.status === 'scheduled' ? data.scheduledFor : announcement.scheduledFor
          } as Announcement;
        }
        return announcement;
      }));

      const updated = announcements.find(announcement => announcement.id === id);
      if (!updated) throw new Error("Announcement not found");
      return updated;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update announcement");
    }
  }, [announcements]);

  const deleteAnnouncement = useCallback(async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete announcement");
    }
  }, []);

  const duplicateAnnouncement = useCallback(async (id: string): Promise<Announcement> => {
    try {
      const original = announcements.find(announcement => announcement.id === id);
      if (!original) throw new Error("Announcement not found");

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const duplicated: Announcement = {
        ...original,
        id: `announcement_${Date.now()}`,
        title: `${original.title} (Copy)`,
        slug: `${original.slug}-copy`,
        status: 'draft',
        publishedAt: undefined,
        scheduledFor: undefined,
        lastModified: new Date(),
        version: 1,
        acknowledgmentCount: 0
      };

      setAnnouncements(prev => [duplicated, ...prev]);
      return duplicated;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to duplicate announcement");
    }
  }, [announcements]);

  // Status management
  const publishAnnouncement = useCallback(async (id: string): Promise<void> => {
    await updateAnnouncement(id, { status: 'published', publishedAt: new Date() });
  }, [updateAnnouncement]);

  const archiveAnnouncement = useCallback(async (id: string): Promise<void> => {
    await updateAnnouncement(id, { status: 'archived' });
  }, [updateAnnouncement]);

  const scheduleAnnouncement = useCallback(async (id: string, date: Date): Promise<void> => {
    await updateAnnouncement(id, { status: 'scheduled', scheduledFor: date });
  }, [updateAnnouncement]);

  const unpublishAnnouncement = useCallback(async (id: string): Promise<void> => {
    await updateAnnouncement(id, { status: 'draft' });
  }, [updateAnnouncement]);

  const reviewAnnouncement = useCallback(async (id: string, reviewerId: string): Promise<void> => {
    const reviewer = mockArticles.find(a => a.author.id === reviewerId)?.author;
    await updateAnnouncement(id, { status: 'review', reviewerId });
  }, [updateAnnouncement]);

  // Bulk operations
  const bulkPublish = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAnnouncements(prev => prev.map(announcement => {
        if (ids.includes(announcement.id)) {
          return {
            ...announcement,
            status: 'published' as any,
            publishedAt: new Date(),
            lastModified: new Date()
          };
        }
        return announcement;
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk publish");
    }
  }, []);

  const bulkArchive = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAnnouncements(prev => prev.map(announcement => {
        if (ids.includes(announcement.id)) {
          return {
            ...announcement,
            status: 'archived' as any,
            lastModified: new Date()
          };
        }
        return announcement;
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk archive");
    }
  }, []);

  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAnnouncements(prev => prev.filter(announcement => !ids.includes(announcement.id)));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk delete");
    }
  }, []);

  const bulkReview = useCallback(async (ids: string[], reviewerId: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reviewer = mockArticles.find(a => a.author.id === reviewerId)?.author;
      
      setAnnouncements(prev => prev.map(announcement => {
        if (ids.includes(announcement.id)) {
          return {
            ...announcement,
            status: 'review' as any,
            reviewer,
            reviewedAt: new Date(),
            lastModified: new Date()
          };
        }
        return announcement;
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to bulk review");
    }
  }, []);

  // Utility functions
  const exportAnnouncements = useCallback((format: 'csv' | 'json' | 'pdf') => {
    const dataToExport = paginatedAnnouncements.map(announcement => ({
      title: announcement.title,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      status: announcement.status,
      author: announcement.author.name,
      publishedAt: announcement.publishedAt,
      expiresAt: announcement.expiresAt,
      acknowledgmentCount: announcement.acknowledgmentCount || 0,
      isPinned: announcement.isPinned,
      isUrgent: announcement.isUrgent
    }));

    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        const headers = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map(item => 
          Object.values(item).map(value => `"${value}"`).join(',')
        ).join('\n');
        content = `${headers}\n${rows}`;
        mimeType = 'text/csv';
        filename = `announcements-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        filename = `announcements-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'pdf':
        // In a real app, you'd use a PDF library
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        filename = `announcements-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [paginatedAnnouncements]);

  const importAnnouncements = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // In a real app, you'd validate and process imported data
      console.log('Imported announcements:', data);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data after import
      refreshData();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to import announcements");
    }
  }, [refreshData]);

  return {
    // Data
    announcements: filteredAnnouncements,
    statistics,
    filteredAnnouncements,
    
    // State
    loading,
    error,
    filters,
    
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    
    // Actions
    refreshData,
    updateFilters,
    clearFilters,
    
    // CRUD operations
    getAnnouncement,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    duplicateAnnouncement,
    
    // Status management
    publishAnnouncement,
    archiveAnnouncement,
    scheduleAnnouncement,
    unpublishAnnouncement,
    reviewAnnouncement,
    
    // Bulk operations
    bulkPublish,
    bulkArchive,
    bulkDelete,
    bulkReview,
    
    // Utility
    exportAnnouncements,
    importAnnouncements
  };
}