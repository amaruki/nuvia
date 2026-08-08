import type { Media, MediaPermission, MediaUsage, MediaVersion } from "@/types/media";

// Mock data for versions, usage, and permissions
export function getMockVersions(media: Media | null): MediaVersion[] {
  return media
    ? [
        {
          id: `${media.id}-v3`,
          mediaId: media.id,
          version: 3,
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
          metadata: media.metadata,
          changelog: "Updated metadata and optimized file size",
          createdBy: "John Doe",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isActive: true,
          size: media.metadata.size,
        },
        {
          id: `${media.id}-v2`,
          mediaId: media.id,
          version: 2,
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
          metadata: { ...media.metadata },
          changelog: "Added tags and description",
          createdBy: "Jane Smith",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isActive: false,
          size: Math.floor(media.metadata.size * 1.2),
        },
        {
          id: `${media.id}-v1`,
          mediaId: media.id,
          version: 1,
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
          metadata: { ...media.metadata },
          changelog: "Initial upload",
          createdBy: "Mike Johnson",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          isActive: false,
          size: Math.floor(media.metadata.size * 1.5),
        },
      ]
    : [];
}

export function getMockUsage(media: Media | null): MediaUsage[] {
  return media
    ? [
        {
          id: "usage-1",
          mediaId: media.id,
          entityType: "article",
          entityId: "article-1",
          entityTitle: "Getting Started with Our Platform",
          usageType: "featured_image",
          url: media.url,
          addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          addedBy: "John Doe",
        },
        {
          id: "usage-2",
          mediaId: media.id,
          entityType: "announcement",
          entityId: "announcement-1",
          entityTitle: "Community Update - December 2024",
          usageType: "attachment",
          url: media.url,
          addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          addedBy: "Jane Smith",
        },
      ]
    : [];
}

export function getMockPermissions(media: Media | null): MediaPermission[] {
  return media
    ? [
        {
          id: "perm-1",
          mediaId: media.id,
          entityType: "user",
          entityId: "user-1",
          entityName: "John Doe",
          permissions: ["view", "download", "edit"],
          grantedBy: "Admin",
          grantedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: "perm-2",
          mediaId: media.id,
          entityType: "role",
          entityId: "role-1",
          entityName: "Content Editors",
          permissions: ["view", "download"],
          grantedBy: "Admin",
          grantedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ]
    : [];
}
