import type { PermissionOption } from "./types";

export const PERMISSION_OPTIONS: PermissionOption[] = [
  { id: "view", label: "View", description: "Can view the media file" },
  { id: "download", label: "Download", description: "Can download the media file" },
  { id: "edit", label: "Edit", description: "Can edit media metadata" },
  { id: "delete", label: "Delete", description: "Can delete the media file" },
  { id: "share", label: "Share", description: "Can share with others" },
];
