import type { ChapterRole, ChapterStatus } from "@/types/chapter.types";
import type { FilterOption, MemberCountRange } from "./types";

export const statusOptions: FilterOption<ChapterStatus>[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

export const regionOptions: FilterOption[] = [
  { value: "Northeast", label: "Northeast" },
  { value: "Southeast", label: "Southeast" },
  { value: "Midwest", label: "Midwest" },
  { value: "West", label: "West" },
  { value: "Southwest", label: "Southwest" },
];

export const countryOptions: FilterOption[] = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
];

export const leadershipRoleOptions: FilterOption<ChapterRole>[] = [
  { value: "president", label: "President" },
  { value: "vice_president", label: "Vice President" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

export const memberCountRanges: { value: MemberCountRange; label: string }[] = [
  { value: { min: 0, max: 50 }, label: "0-50 members" },
  { value: { min: 51, max: 100 }, label: "51-100 members" },
  { value: { min: 101, max: 200 }, label: "101-200 members" },
  { value: { min: 201, max: 500 }, label: "201-500 members" },
  { value: { min: 501, max: 1000 }, label: "501-1000 members" },
  { value: { min: 1001, max: 9999 }, label: "1000+ members" },
];
