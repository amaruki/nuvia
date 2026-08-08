import { CommitteeAuthorityLevel, CommitteeStatus, CommitteeType } from "@/types/committee";

export const statusOptions: { value: CommitteeStatus; label: string; description: string }[] = [
  { value: "active", label: "Active", description: "Fully operational committee" },
  { value: "inactive", label: "Inactive", description: "Temporarily suspended" },
  { value: "pending", label: "Pending", description: "Awaiting approval" },
  { value: "suspended", label: "Suspended", description: "Under review" },
];

export const typeOptions: { value: CommitteeType; label: string; description: string }[] = [
  { value: "executive", label: "Executive", description: "Strategic decision-making" },
  { value: "functional", label: "Functional", description: "Ongoing operational focus" },
  { value: "special_interest", label: "Special Interest", description: "Specific topic focus" },
  { value: "ad_hoc", label: "Ad Hoc", description: "Temporary purpose" },
  { value: "standing", label: "Standing", description: "Permanent committee" },
];

export const authorityOptions: {
  value: CommitteeAuthorityLevel;
  label: string;
  description: string;
}[] = [
  { value: "advisory", label: "Advisory", description: "Recommendations only" },
  { value: "operational", label: "Operational", description: "Day-to-day decisions" },
  { value: "strategic", label: "Strategic", description: "Long-term planning" },
  { value: "executive", label: "Executive", description: "Full authority" },
];
