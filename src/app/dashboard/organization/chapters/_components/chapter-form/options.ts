import type { ChapterStatus } from "@/types/chapter.types";

export const statusOptions: { value: ChapterStatus; label: string; description: string }[] = [
  { value: "active", label: "Active", description: "Chapter is fully operational" },
  { value: "inactive", label: "Inactive", description: "Chapter is temporarily suspended" },
  { value: "pending", label: "Pending", description: "Chapter is awaiting approval" },
  { value: "suspended", label: "Suspended", description: "Chapter is suspended due to violations" },
];

export const meetingFrequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

export const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];
