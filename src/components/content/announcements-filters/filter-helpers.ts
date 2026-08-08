import type { AnnouncementFilters } from "@/types/announcement";

export function getActiveFilterCount(filters: AnnouncementFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.status?.length) count++;
  if (filters.type?.length) count++;
  if (filters.priority?.length) count++;
  if (filters.targetAudience?.length) count++;
  if (filters.author?.length) count++;
  if (filters.tags?.length) count++;
  if (filters.dateRange) count++;
  if (filters.expiresAt) count++;
  if (filters.isPinned !== undefined) count++;
  if (filters.isUrgent !== undefined) count++;
  if (filters.requiresAcknowledgment !== undefined) count++;
  if (filters.hasExpiration !== undefined) count++;
  if (filters.sendEmailNotification !== undefined) count++;
  if (filters.sendPushNotification !== undefined) count++;
  if (filters.displayOnHomepage !== undefined) count++;
  if (filters.displayInDashboard !== undefined) count++;
  return count;
}

export function toggleArrayFilterValue<T extends string>(values: T[] | undefined, value: T): T[] {
  const currentArray = values || [];
  return currentArray.includes(value)
    ? currentArray.filter((item) => item !== value)
    : [...currentArray, value];
}

export function removeArrayFilterValue<T extends string>(values: T[] | undefined, value: T): T[] {
  return (values || []).filter((item) => item !== value);
}
