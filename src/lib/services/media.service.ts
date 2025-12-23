import { 
  Media, 
  MediaFolder, 
  MediaVersion, 
  MediaUsage, 
  MediaPermission, 
  MediaAnalytics,
  MediaType, 
  MediaStatus, 
  MediaVisibility,
  MediaFilters,
  MediaUploadOptions,
  CreateMediaData,
  UpdateMediaData,
  CreateFolderData,
  UpdateFolderData,
  MediaStatistics
} from '@/types/media.types';
import {
  mockMediaData,
  mockFolders,
  mockVersions,
  mockUsage,
  mockPermissions,
  mockAnalytics,
  mockTags
} from '@/lib/data/mock-media-data'

// Simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate API response structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    timestamp: string;
    version: string;
    total?: number;
    page?: number;
    totalPages?: number;
  };
}

// Error handling
class MediaServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'MediaServiceError';
  }
}

// Validation helpers
const validateMediaData = (data: CreateMediaData | UpdateMediaData): void => {
  if (!data.title || data.title.trim().length < 1) {
    throw new MediaServiceError('Title is required', 'VALIDATION_ERROR', 400);
  }
  
  if (data.title && data.title.length > 200) {
    throw new MediaServiceError('Title must be less than 200 characters', 'VALIDATION_ERROR', 400);
  }
  
  if (data.description && data.description.length > 2000) {
    throw new MediaServiceError('Description must be less than 2000 characters', 'VALIDATION_ERROR', 400);
  }
  
  if (data.altText && data.altText.length > 500) {
    throw new MediaServiceError('Alt text must be less than 500 characters', 'VALIDATION_ERROR', 400);
  }
};

const validateFolderData = (data: CreateFolderData | UpdateFolderData): void => {
  if (!data.name || data.name.trim().length < 1) {
    throw new MediaServiceError('Folder name is required', 'VALIDATION_ERROR', 400);
  }
  
  if (data.name && data.name.length > 100) {
    throw new MediaServiceError('Folder name must be less than 100 characters', 'VALIDATION_ERROR', 400);
  }
  
  if (data.description && data.description.length > 500) {
    throw new MediaServiceError('Description must be less than 500 characters', 'VALIDATION_ERROR', 400);
  }
};

// Main Media Service
export class MediaService {
  // Media CRUD operations
  static async getMedia(filters: MediaFilters = {}): Promise<ApiResponse<{
    media: Media[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    await delay(500);
    
    try {
      let filteredMedia = [...mockMediaData];
      
      // Apply filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredMedia = filteredMedia.filter(media =>
          media.title.toLowerCase().includes(searchLower) ||
          (media.description && media.description.toLowerCase().includes(searchLower)) ||
          (media.altText && media.altText.toLowerCase().includes(searchLower)) ||
          media.tags.some((tag: any) => tag.name.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.type && filters.type.length > 0) {
        filteredMedia = filteredMedia.filter(media => filters.type!.includes(media.type));
      }
      
      if (filters.status && filters.status.length > 0) {
        filteredMedia = filteredMedia.filter(media => filters.status!.includes(media.status));
      }
      
      if (filters.visibility && filters.visibility.length > 0) {
        filteredMedia = filteredMedia.filter(media => filters.visibility!.includes(media.visibility));
      }
      
      if (filters.folderId) {
        filteredMedia = filteredMedia.filter(media => media.folderId === filters.folderId);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filteredMedia = filteredMedia.filter(media =>
          filters.tags!.some(tagName => media.tags.some((tag: any) => tag.name === tagName))
        );
      }
      
      if (filters.dateRange?.start) {
        filteredMedia = filteredMedia.filter(media =>
          new Date(media.createdAt) >= new Date(filters.dateRange!.start)
        );
      }
      
      if (filters.dateRange?.end) {
        filteredMedia = filteredMedia.filter(media =>
          new Date(media.createdAt) <= new Date(filters.dateRange!.end)
        );
      }
      
      if (filters.sizeRange?.min) {
        filteredMedia = filteredMedia.filter(media =>
          media.metadata.size >= filters.sizeRange!.min
        );
      }
      
      if (filters.sizeRange?.max) {
        filteredMedia = filteredMedia.filter(media =>
          media.metadata.size <= filters.sizeRange!.max
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filteredMedia.sort((a, b) => {
          const aValue = a[filters.sortBy as keyof Media];
          const bValue = b[filters.sortBy as keyof Media];
          
          if (aValue === undefined || bValue === undefined) return 0;
          
          if (filters.sortOrder === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        });
      }
      
      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMedia = filteredMedia.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          media: paginatedMedia,
          total: filteredMedia.length,
          page,
          totalPages: Math.ceil(filteredMedia.length / limit)
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          total: filteredMedia.length,
          page,
          totalPages: Math.ceil(filteredMedia.length / limit)
        }
      };
    } catch (error) {
      throw new MediaServiceError(
        'Failed to fetch media',
        'FETCH_ERROR',
        500
      );
    }
  }
  
  static async getMediaById(id: string): Promise<ApiResponse<Media>> {
    await delay(300);
    
    const media = mockMediaData.find((m: any) => m.id === id);
    if (!media) {
      throw new MediaServiceError(
        'Media not found',
        'NOT_FOUND',
        404
      );
    }
    
    return {
      success: true,
      data: media,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async createMedia(data: CreateMediaData): Promise<ApiResponse<Media>> {
    await delay(800);
    
    validateMediaData(data);
    
    const newMedia: Media = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      slug: data.title.toLowerCase().replace(/\s+/g, '-'),
      title: data.title,
      description: data.description || '',
      altText: data.altText || '',
      type: data.type,
      status: 'ready',
      visibility: data.visibility || 'private',
      url: data.url || '',
      thumbnailUrl: data.thumbnailUrl || '',
      previewUrl: data.previewUrl || '',
      folderId: data.folderId || undefined,
      tags: data.tags?.map(tagName => mockTags.find((tag: any) => tag.name === tagName) || {
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, '-'),
        color: '#6B7280',
        description: '',
        count: 1,
        createdAt: new Date(),
        createdBy: 'current_user'
      }) || [],
      categories: [],
      metadata: {
        size: data.size || 0,
        originalName: data.title,
        fileName: data.title,
        fileExtension: data.format || '',
        mimeType: data.mimeType || '',
        sizeFormatted: '',
        dimensions: data.width && data.height ? {
          width: data.width,
          height: data.height,
          aspectRatio: data.width / data.height
        } : undefined,
        duration: data.duration,
        colorSpace: data.colorSpace,
        checksum: `checksum_${Date.now()}`,
        customFields: data.custom || {}
      },
      createdBy: data.uploadedBy || 'current_user',
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 1,
      versions: [],
      usage: [],
      permissions: [],
      analytics: [],
      isFeatured: false,
      priority: 0,
      storageType: 'local',
      storagePath: '',
      isOptimized: false,
      hasWebpVersion: false,
      hasAvifVersion: false,
      allowedRoles: [],
      allowedChapters: [],
      allowedCommittees: [],
    };
    
    mockMediaData.unshift(newMedia);
    
    return {
      success: true,
      data: newMedia,
      message: 'Media created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async updateMedia(id: string, data: UpdateMediaData): Promise<ApiResponse<Media>> {
    await delay(600);
    
    validateMediaData(data);
    
    const mediaIndex = mockMediaData.findIndex((m: Media) => m.id === id);
    if (mediaIndex === -1) {
      throw new MediaServiceError(
        'Media not found',
        'NOT_FOUND',
        404
      );
    }
    
    // Handle tags conversion if needed
    let updatedTags = mockMediaData[mediaIndex].tags;
    if (data.tags) {
      updatedTags = data.tags.map(tagName => mockTags.find((tag: any) => tag.name === tagName) || {
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, '-'),
        color: '#6B7280',
        description: '',
        count: 1,
        createdAt: new Date(),
        createdBy: 'current_user'
      });
    }
    
    // Handle metadata properly to ensure all required fields are present
    const updatedMetadata = {
      ...mockMediaData[mediaIndex].metadata,
      ...data.metadata,
      // Ensure required fields are not undefined
      originalName: data.metadata?.originalName || mockMediaData[mediaIndex].metadata.originalName,
      fileName: data.metadata?.fileName || mockMediaData[mediaIndex].metadata.fileName,
      fileExtension: data.metadata?.fileExtension || mockMediaData[mediaIndex].metadata.fileExtension,
      mimeType: data.metadata?.mimeType || mockMediaData[mediaIndex].metadata.mimeType,
      size: data.metadata?.size ?? mockMediaData[mediaIndex].metadata.size,
      sizeFormatted: data.metadata?.sizeFormatted || mockMediaData[mediaIndex].metadata.sizeFormatted,
      checksum: data.metadata?.checksum || mockMediaData[mediaIndex].metadata.checksum
    };
    
    const updatedMedia: Media = {
      ...mockMediaData[mediaIndex],
      ...data,
      tags: updatedTags,
      metadata: updatedMetadata,
      updatedAt: new Date(),
      currentVersion: mockMediaData[mediaIndex].currentVersion + 1,
      folderId: data.folderId === null ? undefined : data.folderId
    };
    
    mockMediaData[mediaIndex] = updatedMedia;
    
    return {
      success: true,
      data: updatedMedia,
      message: 'Media updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async deleteMedia(id: string): Promise<ApiResponse<void>> {
    await delay(400);
    
    const mediaIndex = mockMediaData.findIndex((m: Media) => m.id === id);
    if (mediaIndex === -1) {
      throw new MediaServiceError(
        'Media not found',
        'NOT_FOUND',
        404
      );
    }
    
    mockMediaData.splice(mediaIndex, 1);
    
    return {
      success: true,
      data: undefined,
      message: 'Media deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async duplicateMedia(id: string): Promise<ApiResponse<Media>> {
    await delay(500);
    
    const originalMedia = mockMediaData.find((m: Media) => m.id === id);
    if (!originalMedia) {
      throw new MediaServiceError(
        'Media not found',
        'NOT_FOUND',
        404
      );
    }
    
    const duplicatedMedia: Media = {
      ...originalMedia,
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${originalMedia.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 1,
      versions: [],
      usage: [],
      permissions: [],
      analytics: []
    };
    
    mockMediaData.unshift(duplicatedMedia);
    
    return {
      success: true,
      data: duplicatedMedia,
      message: 'Media duplicated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  // Bulk operations
  static async bulkDeleteMedia(ids: string[]): Promise<ApiResponse<void>> {
    await delay(800);
    
    let deletedCount = 0;
    ids.forEach(id => {
      const index = mockMediaData.findIndex((m: Media) => m.id === id);
      if (index !== -1) {
        mockMediaData.splice(index, 1);
        deletedCount++;
      }
    });
    
    return {
      success: true,
      data: undefined,
      message: `${deletedCount} media items deleted successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async bulkUpdateMedia(ids: string[], data: UpdateMediaData): Promise<ApiResponse<Media[]>> {
    await delay(1000);
    
    const updatedMedia: Media[] = [];
    
    ids.forEach(id => {
      const index = mockMediaData.findIndex((m: Media) => m.id === id);
      if (index !== -1) {
        // Handle tags conversion if needed
        let updatedTags = mockMediaData[index].tags;
        if (data.tags) {
          updatedTags = data.tags.map(tagName => mockTags.find((tag: any) => tag.name === tagName) || {
            id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            color: '#6B7280',
            description: '',
            count: 1,
            createdAt: new Date(),
            createdBy: 'current_user'
          });
        }
        
        // Handle metadata properly to ensure all required fields are present
        const updatedMetadata = {
          ...mockMediaData[index].metadata,
          ...data.metadata,
          // Ensure required fields are not undefined
          originalName: data.metadata?.originalName || mockMediaData[index].metadata.originalName,
          fileName: data.metadata?.fileName || mockMediaData[index].metadata.fileName,
          fileExtension: data.metadata?.fileExtension || mockMediaData[index].metadata.fileExtension,
          mimeType: data.metadata?.mimeType || mockMediaData[index].metadata.mimeType,
          size: data.metadata?.size ?? mockMediaData[index].metadata.size,
          sizeFormatted: data.metadata?.sizeFormatted || mockMediaData[index].metadata.sizeFormatted,
          checksum: data.metadata?.checksum || mockMediaData[index].metadata.checksum
        };
        
        const updatedMediaItem: Media = {
          ...mockMediaData[index],
          ...data,
          tags: updatedTags,
          metadata: updatedMetadata,
          updatedAt: new Date(),
          currentVersion: mockMediaData[index].currentVersion + 1,
          folderId: data.folderId === null ? undefined : data.folderId
        };
        
        mockMediaData[index] = updatedMediaItem;
        updatedMedia.push(updatedMediaItem);
      }
    });
    
    return {
      success: true,
      data: updatedMedia,
      message: `${updatedMedia.length} media items updated successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async bulkMoveMedia(ids: string[], folderId: string): Promise<ApiResponse<Media[]>> {
    await delay(800);
    
    const updatedMedia: Media[] = [];
    
    ids.forEach(id => {
      const index = mockMediaData.findIndex((m: Media) => m.id === id);
      if (index !== -1) {
        mockMediaData[index] = {
          ...mockMediaData[index],
          folderId,
          updatedAt: new Date(),
          currentVersion: mockMediaData[index].currentVersion + 1
        };
        updatedMedia.push(mockMediaData[index]);
      }
    });
    
    return {
      success: true,
      data: updatedMedia,
      message: `${updatedMedia.length} media items moved successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  // Folder operations
  static async getFolders(): Promise<ApiResponse<MediaFolder[]>> {
    await delay(300);
    
    return {
      success: true,
      data: mockFolders,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async getFolderById(id: string): Promise<ApiResponse<MediaFolder>> {
    await delay(200);
    
    const folder = mockFolders.find((f: MediaFolder) => f.id === id);
    if (!folder) {
      throw new MediaServiceError(
        'Folder not found',
        'NOT_FOUND',
        404
      );
    }
    
    return {
      success: true,
      data: folder,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async createFolder(data: CreateFolderData): Promise<ApiResponse<MediaFolder>> {
    await delay(400);
    
    validateFolderData(data);
    
    const newFolder: MediaFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description || '',
      parentId: data.parentId || undefined,
      path: data.parentId ? `${mockFolders.find((f: any) => f.id === data.parentId)?.path || ''}/${data.name.toLowerCase().replace(/\s+/g, '-')}` : `/${data.name.toLowerCase().replace(/\s+/g, '-')}`,
      level: data.parentId ? (mockFolders.find((f: any) => f.id === data.parentId)?.level || 0) + 1 : 0,
      order: mockFolders.length + 1,
      color: '#6B7280',
      icon: 'folder',
      visibility: data.visibility || 'private',
      allowedRoles: data.permissions || [],
      allowedChapters: [],
      allowedCommittees: [],
      mediaCount: 0,
      totalSize: 0,
      lastModified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy || 'current_user'
    };
    
    mockFolders.push(newFolder);
    
    return {
      success: true,
      data: newFolder,
      message: 'Folder created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async updateFolder(id: string, data: UpdateFolderData): Promise<ApiResponse<MediaFolder>> {
    await delay(400);
    
    validateFolderData(data);
    
    const folderIndex = mockFolders.findIndex((f: MediaFolder) => f.id === id);
    if (folderIndex === -1) {
      throw new MediaServiceError(
        'Folder not found',
        'NOT_FOUND',
        404
      );
    }
    
    const updatedFolder = {
      ...mockFolders[folderIndex],
      ...data,
      updatedAt: new Date(),
      lastModified: new Date()
    };
    
    mockFolders[folderIndex] = updatedFolder;
    
    return {
      success: true,
      data: updatedFolder,
      message: 'Folder updated successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async deleteFolder(id: string): Promise<ApiResponse<void>> {
    await delay(400);
    
    const folderIndex = mockFolders.findIndex((f: MediaFolder) => f.id === id);
    if (folderIndex === -1) {
      throw new MediaServiceError(
        'Folder not found',
        'NOT_FOUND',
        404
      );
    }
    
    // Check if folder has media
    const folderMedia = mockMediaData.filter((m: Media) => m.folderId === id);
    if (folderMedia.length > 0) {
      throw new MediaServiceError(
        'Cannot delete folder with media items',
        'FOLDER_NOT_EMPTY',
        400
      );
    }
    
    mockFolders.splice(folderIndex, 1);
    
    return {
      success: true,
      data: undefined,
      message: 'Folder deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  // Version operations
  static async getMediaVersions(mediaId: string): Promise<ApiResponse<MediaVersion[]>> {
    await delay(300);
    
    const versions = mockVersions.filter((v: MediaVersion) => v.mediaId === mediaId);
    
    return {
      success: true,
      data: versions,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async createMediaVersion(mediaId: string, data: Partial<Media>): Promise<ApiResponse<MediaVersion>> {
    await delay(600);
    
    const media = mockMediaData.find((m: Media) => m.id === mediaId);
    if (!media) {
      throw new MediaServiceError(
        'Media not found',
        'NOT_FOUND',
        404
      );
    }
    
    const newVersion: MediaVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: media.currentVersion + 1,
      mediaId,
      url: data.url || media.url,
      thumbnailUrl: data.thumbnailUrl || media.thumbnailUrl,
      metadata: {
        originalName: media.metadata.originalName,
        fileName: media.metadata.fileName,
        fileExtension: media.metadata.fileExtension,
        mimeType: media.metadata.mimeType,
        size: data.metadata?.size ?? media.metadata.size,
        sizeFormatted: media.metadata.sizeFormatted,
        checksum: media.metadata.checksum,
        customFields: media.metadata.customFields || {},
        ...data.metadata
      },
      changelog: 'Updated media properties',
      createdBy: 'current_user',
      createdAt: new Date(),
      isActive: true,
      size: data.metadata?.size ?? media.metadata.size
    };
    
    mockVersions.push(newVersion);
    
    // Update media version
    media.currentVersion = newVersion.version;
    media.updatedAt = new Date();
    
    return {
      success: true,
      data: newVersion,
      message: 'Version created successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  // Analytics operations
  static async getMediaAnalytics(mediaId: string): Promise<ApiResponse<MediaAnalytics>> {
    await delay(400);
    
    const analytics = mockAnalytics.find((a: MediaAnalytics) => a.mediaId === mediaId);
    if (!analytics) {
      throw new MediaServiceError(
        'Analytics not found',
        'NOT_FOUND',
        404
      );
    }
    
    return {
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  static async getOverallAnalytics(): Promise<ApiResponse<{
    totalMedia: number;
    totalViews: number;
    totalDownloads: number;
    totalSize: number;
    mediaByType: Array<{ type: MediaType; count: number; size: number; percentage: number }>;
    recentUploads: Array<{ id: string; title: string; type: MediaType; uploadedAt: Date; uploadedBy: string; size: number }>;
    topPerforming: Array<{ id: string; title: string; type: MediaType; views: number; downloads: number; usage: string }>;
  }>> {
    await delay(600);
    
    const totalMedia = mockMediaData.length;
    const totalViews = mockMediaData.reduce((sum: number, media: Media) => {
      const mediaViews = media.analytics.reduce((viewSum: number, analytic: MediaAnalytics) => viewSum + analytic.views, 0);
      return sum + mediaViews;
    }, 0);
    const totalDownloads = mockMediaData.reduce((sum: number, media: Media) => {
      const mediaDownloads = media.analytics.reduce((downloadSum: number, analytic: MediaAnalytics) => downloadSum + analytic.downloads, 0);
      return sum + mediaDownloads;
    }, 0);
    const totalSize = mockMediaData.reduce((sum: number, media: Media) => sum + media.metadata.size, 0);
    
    // Media by type
    const mediaByTypeMap = new Map<MediaType, { count: number; size: number }>();
    mockMediaData.forEach((media: Media) => {
      const current = mediaByTypeMap.get(media.type) || { count: 0, size: 0 };
      mediaByTypeMap.set(media.type, {
        count: current.count + 1,
        size: current.size + media.metadata.size
      });
    });
    
    const mediaByType = Array.from(mediaByTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      size: data.size,
      percentage: Math.round((data.count / totalMedia) * 100)
    }));
    
    // Recent uploads
    const recentUploads = mockMediaData
      .sort((a: Media, b: Media) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((media: Media) => ({
        id: media.id,
        title: media.title,
        type: media.type,
        uploadedAt: media.createdAt,
        uploadedBy: media.createdBy,
        size: media.metadata.size
      }));
    
    // Top performing
    const topPerforming = mockMediaData
      .sort((a: Media, b: Media) => {
        const aViews = a.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.views, 0);
        const aDownloads = a.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.downloads, 0);
        const bViews = b.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.views, 0);
        const bDownloads = b.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.downloads, 0);
        return (bViews + bDownloads) - (aViews + aDownloads);
      })
      .slice(0, 10)
      .map((media: Media) => {
        const views = media.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.views, 0);
        const downloads = media.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.downloads, 0);
        return {
          id: media.id,
          title: media.title,
          type: media.type,
          views,
          downloads,
          usage: `${Math.round((views + downloads) / 10)}%`
        };
      });
    
    return {
      success: true,
      data: {
        totalMedia,
        totalViews,
        totalDownloads,
        totalSize,
        mediaByType,
        recentUploads,
        topPerforming
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  // Import/Export operations
  static async exportMedia(format: 'csv' | 'json', filters?: MediaFilters): Promise<ApiResponse<string>> {
    await delay(1000);
    
    const { data: { media } } = await this.getMedia(filters);
    
    if (format === 'csv') {
      const headers = ['ID', 'Title', 'Type', 'Status', 'Visibility', 'Size', 'Created', 'Updated'];
      const csvContent = [
        headers.join(','),
        ...media.map(item => [
          item.id,
          `"${item.title}"`,
          item.type,
          item.status,
          item.visibility,
          item.metadata.size,
          item.createdAt.toISOString(),
          item.updatedAt.toISOString()
        ].join(','))
      ].join('\n');
      
      return {
        success: true,
        data: csvContent,
        message: 'Media exported as CSV',
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };
    } else {
      const jsonContent = JSON.stringify({
        exportDate: new Date().toISOString(),
        totalItems: media.length,
        media: media.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          visibility: item.visibility,
          metadata: item.metadata,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
      }, null, 2);
      
      return {
        success: true,
        data: jsonContent,
        message: 'Media exported as JSON',
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };
    }
  }
  
  static async importMedia(file: File): Promise<ApiResponse<{
    imported: number;
    skipped: number;
    errors: string[];
  }>> {
    await delay(2000);
    
    const content = await file.text();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    try {
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        if (Array.isArray(data.media)) {
          for (const item of data.media) {
            try {
              await this.createMedia({
                title: item.title,
                type: item.type,
                description: item.description || '',
                visibility: item.visibility || 'private',
                size: item.metadata?.size || 0,
                format: item.metadata?.format || '',
                mimeType: item.metadata?.mimeType || ''
              });
              imported++;
            } catch (error) {
              skipped++;
              errors.push(`Failed to import ${item.title}: ${error}`);
            }
          }
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 3) {
            try {
              await this.createMedia({
                title: values[1].replace(/"/g, ''),
                type: values[2] as MediaType,
                visibility: 'private',
                size: parseInt(values[5]) || 0
              });
              imported++;
            } catch (error) {
              skipped++;
              errors.push(`Failed to import row ${i + 1}: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      throw new MediaServiceError(
        'Invalid file format',
        'INVALID_FORMAT',
        400
      );
    }
    
    return {
      success: true,
      data: { imported, skipped, errors },
      message: `Import completed: ${imported} imported, ${skipped} skipped`,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  // Upload operations
  static async uploadMedia(files: File[], options: MediaUploadOptions): Promise<ApiResponse<Media[]>> {
    await delay(1500);
    
    const uploadedMedia: Media[] = [];
    
    for (const file of files) {
      try {
        const mediaType = this.getMediaTypeFromFile(file);
        const mediaData: CreateMediaData = {
          title: file.name,
          type: mediaType,
          size: file.size,
          format: file.name.split('.').pop() || '',
          mimeType: file.type,
          visibility: options.visibility || 'private',
          folderId: options.folderId || null,
          description: '',
          uploadedBy: 'current_user'
        };
        
        const { data: media } = await this.createMedia(mediaData);
        uploadedMedia.push(media);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
    
    return {
      success: true,
      data: uploadedMedia,
      message: `${uploadedMedia.length} files uploaded successfully`,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
  
  // Utility methods
  private static getMediaTypeFromFile(file: File): MediaType {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type === 'application/pdf') return 'pdf';
    if (type.includes('document') || type.includes('word')) return 'document';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return 'archive';
    
    return 'document';
  }
  
  // Statistics
  static async getStatistics(): Promise<ApiResponse<MediaStatistics>> {
    await delay(400);
    
    const totalMedia = mockMediaData.length;
    const totalSize = mockMediaData.reduce((sum: number, media: Media) => sum + media.metadata.size, 0);
    const totalViews = mockMediaData.reduce((sum: number, media: Media) => {
      const mediaViews = media.analytics.reduce((viewSum: number, analytic: MediaAnalytics) => viewSum + analytic.views, 0);
      return sum + mediaViews;
    }, 0);
    const totalDownloads = mockMediaData.reduce((sum: number, media: Media) => {
      const mediaDownloads = media.analytics.reduce((downloadSum: number, analytic: MediaAnalytics) => downloadSum + analytic.downloads, 0);
      return sum + mediaDownloads;
    }, 0);
    
    // Format size
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Media by type
    const mediaByTypeMap = new Map<MediaType, { count: number; size: number }>();
    mockMediaData.forEach((media: Media) => {
      const current = mediaByTypeMap.get(media.type) || { count: 0, size: 0 };
      mediaByTypeMap.set(media.type, {
        count: current.count + 1,
        size: current.size + media.metadata.size
      });
    });
    
    const mediaByType = Array.from(mediaByTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      size: data.size,
      sizeFormatted: formatSize(data.size),
      percentage: Math.round((data.count / totalMedia) * 100)
    }));
    
    // Recent uploads
    const recentUploads = mockMediaData
      .sort((a: Media, b: Media) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((media: Media) => ({
        id: media.id,
        title: media.title,
        type: media.type,
        uploadedAt: media.createdAt,
        uploadedBy: media.createdBy,
        size: media.metadata.size
      }));
    
    // Top performing
    const topPerforming = mockMediaData
      .sort((a: Media, b: Media) => {
        const aViews = a.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.views, 0);
        const aDownloads = a.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.downloads, 0);
        const bViews = b.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.views, 0);
        const bDownloads = b.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.downloads, 0);
        return (bViews + bDownloads) - (aViews + aDownloads);
      })
      .slice(0, 10)
      .map((media: Media) => {
        const views = media.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.views, 0);
        const downloads = media.analytics.reduce((sum: number, analytic: MediaAnalytics) => sum + analytic.downloads, 0);
        return {
          id: media.id,
          title: media.title,
          type: media.type,
          views,
          downloads,
          usage: Math.round((views + downloads) / 10)
        };
      });
    
    return {
      success: true,
      data: {
        totalMedia,
        totalSize,
        totalSizeFormatted: formatSize(totalSize),
        totalViews,
        totalDownloads,
        mediaByType,
        mediaByStatus: [],
        mediaByVisibility: [],
        storageUsage: {
          local: 0,
          s3: totalSize,
          cloudinary: 0,
          azure: 0,
          gcs: 0
        },
        totalUsage: 0,
        monthlyTrends: [],
        recentUploads,
        topPerforming
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    };
  }
}

export default MediaService;