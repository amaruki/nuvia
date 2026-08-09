import type { FilterOption } from "./types";

export const statusOptions: FilterOption[] = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "pledged", label: "Pledged" },
];

export const donorTypeOptions: FilterOption[] = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
  { value: "anonymous", label: "Anonymous" },
];

export const donationTypeOptions: FilterOption[] = [
  { value: "one_time", label: "One Time" },
  { value: "recurring", label: "Recurring" },
  { value: "pledge", label: "Pledge" },
];

export const campaignOptions: FilterOption[] = [
  { value: "Annual Fund Drive 2024", label: "Annual Fund Drive 2024" },
  { value: "Youth Education Initiative", label: "Youth Education Initiative" },
  { value: "Community Center Renovation", label: "Community Center Renovation" },
  { value: "Emergency Relief Fund", label: "Emergency Relief Fund" },
];
