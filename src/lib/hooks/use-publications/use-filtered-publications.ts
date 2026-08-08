"use client";

import { useMemo } from "react";

import type { Publication, PublicationFilters } from "@/types/publication.types";

export function useFilteredPublications(
  publications: Publication[],
  filters: PublicationFilters,
): Publication[] {
  // Filter and sort publications
  const filteredPublications = useMemo(() => {
    let filtered = [...publications];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (pub) =>
          pub.title.toLowerCase().includes(searchLower) ||
          pub.excerpt.toLowerCase().includes(searchLower) ||
          pub.content.toLowerCase().includes(searchLower) ||
          pub.author.name.toLowerCase().includes(searchLower),
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((pub) => filters.status!.includes(pub.status));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((pub) => filters.type!.includes(pub.type));
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((pub) => filters.category!.includes(pub.category));
    }

    if (filters.author && filters.author.length > 0) {
      filtered = filtered.filter(
        (pub) =>
          filters.author!.includes(pub.author.id) ||
          pub.coAuthors?.some((coAuthor) => filters.author!.includes(coAuthor.id)),
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((pub) => pub.tags.some((tag) => filters.tags!.includes(tag.id)));
    }

    if (filters.dateRange) {
      filtered = filtered.filter((pub) => {
        const pubDate = pub.publishedAt || pub.scheduledFor || pub.lastModified;
        return pubDate >= filters.dateRange!.start && pubDate <= filters.dateRange!.end;
      });
    }

    if (filters.visibility && filters.visibility.length > 0) {
      filtered = filtered.filter((pub) => filters.visibility!.includes(pub.visibility));
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter((pub) => pub.isFeatured === filters.featured);
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (filters.sortBy) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "publishedAt":
            aValue = a.publishedAt || a.scheduledFor || a.lastModified;
            bValue = b.publishedAt || b.scheduledFor || b.lastModified;
            break;
          case "views":
            aValue = a.metrics.views;
            bValue = b.metrics.views;
            break;
          case "engagement":
            aValue = a.metrics.engagementScore;
            bValue = b.metrics.engagementScore;
            break;
          case "author":
            aValue = a.author.name.toLowerCase();
            bValue = b.author.name.toLowerCase();
            break;
          case "category":
            aValue = a.category;
            bValue = b.category;
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
  }, [publications, filters]);

  return filteredPublications;
}
