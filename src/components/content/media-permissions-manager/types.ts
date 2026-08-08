import type { Media, MediaPermission } from "@/types/media";

export interface MediaPermissionsManagerProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdate?: (mediaId: string, permissions: MediaPermission[]) => void;
}

export type PermissionEntityType = MediaPermission["entityType"];

export type PermissionAction = MediaPermission["permissions"][number];

export interface PermissionFormData {
  entityType: PermissionEntityType;
  entityId: string;
  entityName: string;
  permissions: PermissionAction[];
  expiresAt?: Date;
}

export interface EntityOption {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  description?: string;
  location?: string;
}

export interface PermissionOption {
  id: PermissionAction;
  label: string;
  description: string;
}

export interface SearchFilterCardProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  isAddDialogOpen: boolean;
  onAddDialogOpenChange: (open: boolean) => void;
  onAddPermission: (formData: PermissionFormData) => void;
}

export interface AddPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (formData: PermissionFormData) => void;
}

export interface PermissionsListCardProps {
  permissions: MediaPermission[];
  searchTerm: string;
  filterType: string;
  onEdit: (permission: MediaPermission) => void;
  onDelete: (permissionId: string) => void;
  onAddFirst: () => void;
}
