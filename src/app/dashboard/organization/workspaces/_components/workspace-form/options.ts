import type { CommitteeRole, Permission, WorkspaceType } from "@/types/committee";

export const typeOptions: { value: WorkspaceType; label: string; description: string }[] = [
  {
    value: "general",
    label: "General",
    description: "All-purpose workspace for general collaboration",
  },
  { value: "project", label: "Project", description: "Focused workspace for specific projects" },
  {
    value: "document",
    label: "Document",
    description: "Workspace optimized for document management",
  },
  {
    value: "discussion",
    label: "Discussion",
    description: "Workspace for forums and discussions",
  },
  { value: "meeting", label: "Meeting", description: "Workspace for meeting coordination" },
];

export const roleOptions: { value: CommitteeRole; label: string }[] = [
  { value: "chair", label: "Chair" },
  { value: "co_chair", label: "Co-Chair" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "member", label: "Member" },
  { value: "advisor", label: "Advisor" },
];

export const permissionOptions: { value: Permission; label: string; description: string }[] = [
  { value: "view", label: "View", description: "Can view content" },
  { value: "edit", label: "Edit", description: "Can edit content" },
  { value: "delete", label: "Delete", description: "Can delete content" },
  { value: "upload", label: "Upload", description: "Can upload files" },
  { value: "download", label: "Download", description: "Can download files" },
  {
    value: "manage_members",
    label: "Manage Members",
    description: "Can manage workspace members",
  },
  {
    value: "manage_settings",
    label: "Manage Settings",
    description: "Can manage workspace settings",
  },
];
