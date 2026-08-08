"use client";

import { AnnouncementsTable } from "@/components/content/announcements-table";
import type { Announcement } from "@/types/announcement";
import type { ArticleStatus } from "@/types/article";

interface AnnouncementsTabProps {
  announcements: Announcement[];
  onView: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
  onDuplicate: (announcement: Announcement) => void;
  onStatusChange: (announcement: Announcement, status: ArticleStatus) => void;
}

export function AnnouncementsTab({
  announcements,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: AnnouncementsTabProps) {
  return (
    <AnnouncementsTable
      announcements={announcements.slice(0, 10)} // Show first 10 for now
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onStatusChange={onStatusChange}
    />
  );
}
