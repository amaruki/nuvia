import type { CommitteeAuthorityLevel, CommitteeStatus, CommitteeType } from "@/types/committee";
import type { FilterOption } from "./types";

export const statusOptions: FilterOption<CommitteeStatus>[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

export const typeOptions: FilterOption<CommitteeType>[] = [
  { value: "executive", label: "Executive" },
  { value: "functional", label: "Functional" },
  { value: "special_interest", label: "Special Interest" },
  { value: "ad_hoc", label: "Ad Hoc" },
  { value: "standing", label: "Standing" },
];

export const authorityOptions: FilterOption<CommitteeAuthorityLevel>[] = [
  { value: "executive", label: "Executive" },
  { value: "strategic", label: "Strategic" },
  { value: "operational", label: "Operational" },
  { value: "advisory", label: "Advisory" },
];
