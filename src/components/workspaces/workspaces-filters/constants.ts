import type { CommitteeRole, WorkspaceStatus, WorkspaceType } from "@/types/committee";
import type { FilterOption } from "./types";

export const statusOptions: FilterOption<WorkspaceStatus>[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "locked", label: "Locked" },
];

export const typeOptions: FilterOption<WorkspaceType>[] = [
  { value: "general", label: "General" },
  { value: "project", label: "Project" },
  { value: "document", label: "Document" },
  { value: "discussion", label: "Discussion" },
  { value: "meeting", label: "Meeting" },
];

export const roleOptions: FilterOption<CommitteeRole>[] = [
  { value: "chair", label: "Chair" },
  { value: "co_chair", label: "Co-Chair" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "member", label: "Member" },
  { value: "advisor", label: "Advisor" },
];
