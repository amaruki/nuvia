export interface Chapter {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  status: ChapterStatus;
  location: ChapterLocation;
  leadership: ChapterLeadership[];
  memberCount: number;
  establishedDate: Date;
  parentChapterId?: string;
  subChapterIds: string[];
  contactInfo: ChapterContactInfo;
  socialMedia: ChapterSocialMedia;
  metrics: ChapterMetrics;
  events: ChapterEvent[];
  finances: ChapterFinances;
  settings: ChapterSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export type ChapterStatus = "active" | "inactive" | "pending" | "suspended";

export interface ChapterLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  region: string;
}

export interface ChapterLeadership {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: ChapterRole;
  title: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  avatar?: string;
  phone?: string;
}

export type ChapterRole =
  | "president"
  | "vice_president"
  | "secretary"
  | "treasurer"
  | "admin"
  | "member";

export interface ChapterContactInfo {
  email: string;
  phone?: string;
  website?: string;
  address: string;
  mailingAddress?: string;
}

export interface ChapterSocialMedia {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface ChapterMetrics {
  memberGrowthRate: number;
  eventAttendanceRate: number;
  financialHealth: "excellent" | "good" | "fair" | "poor";
  engagementScore: number;
  retentionRate: number;
  newMembersThisMonth: number;
  activeMembersThisMonth: number;
  monthlyTrend: ChapterMonthlyTrend[];
}

export interface ChapterMonthlyTrend {
  month: string;
  memberCount: number;
  eventCount: number;
  attendanceRate: number;
  revenue: number;
}

export interface ChapterEvent {
  id: string;
  title: string;
  date: Date;
  attendance: number;
  revenue: number;
  status: "upcoming" | "completed" | "cancelled";
}

export interface ChapterFinances {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  budget: number;
  budgetUtilization: number;
  monthlyRevenue: ChapterMonthlyFinance[];
  monthlyExpenses: ChapterMonthlyFinance[];
}

export interface ChapterMonthlyFinance {
  month: string;
  amount: number;
}

export interface ChapterSettings {
  allowOnlineRegistration: boolean;
  requireApproval: boolean;
  membershipDues: number;
  meetingFrequency: "weekly" | "biweekly" | "monthly" | "quarterly";
  meetingDay?: string;
  meetingTime?: string;
  autoRenewMembership: boolean;
  sendReminders: boolean;
  publicDirectory: boolean;
}

export interface ChapterFilterOptions {
  status?: ChapterStatus[];
  region?: string[];
  country?: string[];
  memberCountRange?: {
    min: number;
    max: number;
  };
  leadershipRole?: ChapterRole[];
  search?: string;
}

export interface ChapterFormData {
  name: string;
  displayName: string;
  description?: string;
  status: ChapterStatus;
  location: ChapterLocation;
  contactInfo: ChapterContactInfo;
  socialMedia: ChapterSocialMedia;
  settings: ChapterSettings;
  parentChapterId?: string;
}

export interface ChapterOverallStatistics {
  totalChapters: number;
  activeChapters: number;
  inactiveChapters: number;
  pendingChapters: number;
  suspendedChapters: number;
  totalMembers: number;
  averageMembersPerChapter: number;
  totalEvents: number;
  totalRevenue: number;
  memberGrowthRate: number;
  topPerformingChapters: ChapterPerformance[];
  regionalBreakdown: ChapterRegionalBreakdown[];
  monthlyTrend: ChapterMonthlyTrend[];
}

export interface ChapterPerformance {
  chapterId: string;
  chapterName: string;
  location: string;
  memberCount: number;
  growthRate: number;
  eventCount: number;
  attendanceRate: number;
  revenue: number;
  engagementScore: number;
}

export interface ChapterRegionalBreakdown {
  region: string;
  country: string;
  chapterCount: number;
  memberCount: number;
  averageMembersPerChapter: number;
  totalRevenue: number;
}
