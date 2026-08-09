import type { Announcement } from "@/types/announcement";
import type { ArticleStatus } from "@/types/article";

export interface AnnouncementsTableProps {
  announcements: Announcement[];
  onView?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onDuplicate?: (announcement: Announcement) => void;
  onStatusChange?: (announcement: Announcement, status: ArticleStatus) => void;
}
