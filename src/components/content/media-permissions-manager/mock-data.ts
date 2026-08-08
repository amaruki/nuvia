import type { EntityOption, PermissionEntityType } from "./types";

// Mock data for users, roles, chapters, committees
export const mockUsers: EntityOption[] = [
  { id: "user-1", name: "John Doe", email: "john@example.com", avatar: "" },
  { id: "user-2", name: "Jane Smith", email: "jane@example.com", avatar: "" },
  { id: "user-3", name: "Mike Johnson", email: "mike@example.com", avatar: "" },
  { id: "user-4", name: "Sarah Wilson", email: "sarah@example.com", avatar: "" },
];

export const mockRoles: EntityOption[] = [
  { id: "role-1", name: "Admin", description: "Full system access" },
  { id: "role-2", name: "Content Editor", description: "Can edit content" },
  { id: "role-3", name: "Member", description: "Regular member access" },
  { id: "role-4", name: "Viewer", description: "Read-only access" },
];

export const mockChapters: EntityOption[] = [
  { id: "chapter-1", name: "New York Chapter", location: "New York, NY" },
  { id: "chapter-2", name: "Los Angeles Chapter", location: "Los Angeles, CA" },
  { id: "chapter-3", name: "Chicago Chapter", location: "Chicago, IL" },
];

export const mockCommittees: EntityOption[] = [
  { id: "committee-1", name: "Events Committee", description: "Organizes events" },
  { id: "committee-2", name: "Finance Committee", description: "Manages finances" },
  { id: "committee-3", name: "Membership Committee", description: "Handles membership" },
];

export function getEntityOptions(entityType: PermissionEntityType): EntityOption[] {
  switch (entityType) {
    case "user":
      return mockUsers;
    case "role":
      return mockRoles;
    case "chapter":
      return mockChapters;
    case "committee":
      return mockCommittees;
    default:
      return [];
  }
}
