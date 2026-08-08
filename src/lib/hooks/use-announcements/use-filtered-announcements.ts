"use client";

import { useMemo } from "react";

import type { Announcement, AnnouncementFilters } from "@/types/announcement.types";

export function useFilteredAnnouncements(
  announcements: Announcement[],
  filters: AnnouncementFilters,
): Announcement[] {
  // Filter and sort announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(searchLower) ||
          announcement.excerpt.toLowerCase().includes(searchLower) ||
          announcement.content.toLowerCase().includes(searchLower) ||
          announcement.author.name.toLowerCase().includes(searchLower),
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((announcement) => filters.status!.includes(announcement.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((announcement) => filters.type!.includes(announcement.type));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((announcement) =>
        filters.priority!.includes(announcement.priority),
      );
    }

    if (filters.targetAudience && filters.targetAudience.length > 0) {
      filtered = filtered.filter((announcement) =>
        filters.targetAudience!.includes(announcement.targetAudience),
      );
    }

    if (filters.targetChapters && filters.targetChapters.length > 0) {
      filtered = filtered.filter((announcement) =>
        announcement.targetChapters?.some((chapter) => filters.targetChapters!.includes(chapter)),
      );
    }

    if (filters.targetCommittees && filters.targetCommittees.length > 0) {
      filtered = filtered.filter((announcement) =>
        announcement.targetCommittees?.some((committee) =>
          filters.targetCommittees!.includes(committee),
        ),
      );
    }

    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(
        (announcement) =>
          filters.author!.includes(announcement.author.id) ||
          announcement.coAuthors?.some((coAuthor) => filters.author!.includes(coAuthor.id)),
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((announcement) =>
        announcement.tags.some((tag) => filters.tags!.includes(tag.id)),
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter((announcement) => {
        const announcementDate =
          announcement.publishedAt || announcement.scheduledFor || announcement.lastModified;
        return (
          announcementDate >= filters.dateRange!.start && announcementDate <= filters.dateRange!.end
        );
      });
    }

    if (filters.expiresAt) {
      filtered = filtered.filter((announcement) => {
        if (!announcement.expiresAt) return false;
        if (filters.expiresAt!.start && announcement.expiresAt < filters.expiresAt!.start)
          return false;
        if (filters.expiresAt!.end && announcement.expiresAt > filters.expiresAt!.end) return false;
        return true;
      });
    }

    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter((announcement) =>
        filters.visibility!.includes(announcement.visibility),
      );
    }

    if (filters.isPinned !== undefined) {
      filtered = filtered.filter((announcement) => announcement.isPinned === filters.isPinned);
    }

    if (filters.isUrgent !== undefined) {
      filtered = filtered.filter((announcement) => announcement.isUrgent === filters.isUrgent);
    }

    if (filters.requiresAcknowledgment !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.requiresAcknowledgment === filters.requiresAcknowledgment,
      );
    }

    if (filters.hasExpiration !== undefined) {
      filtered = filtered.filter(
        (announcement) => !!announcement.expiresAt === filters.hasExpiration,
      );
    }

    if (filters.sendEmailNotification !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.sendEmailNotification === filters.sendEmailNotification,
      );
    }

    if (filters.sendPushNotification !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.sendPushNotification === filters.sendPushNotification,
      );
    }

    if (filters.displayOnHomepage !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.displayOnHomepage === filters.displayOnHomepage,
      );
    }

    if (filters.displayInDashboard !== undefined) {
      filtered = filtered.filter(
        (announcement) => announcement.displayInDashboard === filters.displayInDashboard,
      );
    }

    if (filters.minAcknowledgmentRate !== undefined) {
      filtered = filtered.filter((announcement) => {
        const rate =
          announcement.acknowledgmentCount && announcement.acknowledgmentCount > 0 ? 100 : 0;
        return rate >= filters.minAcknowledgmentRate!;
      });
    }

    if (filters.maxAcknowledgmentRate !== undefined) {
      filtered = filtered.filter((announcement) => {
        const rate =
          announcement.acknowledgmentCount && announcement.acknowledgmentCount > 0 ? 100 : 0;
        return rate <= filters.maxAcknowledgmentRate!;
      });
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: string | Date;
        let bValue: string | Date;

        switch (filters.sortBy) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "publishedAt":
            aValue = a.publishedAt || a.scheduledFor || a.lastModified;
            bValue = b.publishedAt || b.scheduledFor || b.lastModified;
            break;
          case "author":
            aValue = a.author.name.toLowerCase();
            bValue = b.author.name.toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [announcements, filters]);

  return filteredAnnouncements;
}
