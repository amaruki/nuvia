import type { AnnouncementFilters } from "@/types/announcement.types";

export const DEFAULT_FILTERS: AnnouncementFilters = {
  search: "",
  status: [],
  type: [],
  category: ["announcements"], // Always announcements
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
  limit: 10,
};

export const ITEMS_PER_PAGE = 10;

export const EMPTY_METRICS = {
  views: 0,
  reads: 0,
  shares: 0,
  comments: 0,
  likes: 0,
  bookmarks: 0,
  averageReadTime: 0,
  completionRate: 0,
  engagementScore: 0,
  bounceRate: 0,
};
