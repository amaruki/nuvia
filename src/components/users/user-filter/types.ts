import type { ReactNode } from "react";
import type {
  AuthStatus,
  UserFilter as UserFilterType,
  UserStatus,
} from "@/types/user-management.types";
import type { UserRole } from "@/types/dashboard.types";

export interface UserFilterProps {
  filters: UserFilterType;
  onFilterChange: (filters: UserFilterType) => void;
  onClearFilters?: () => void;
  className?: string;
}

export interface FilterSectionProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export interface UserFilterSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export interface RoleCategoryGroup {
  category: string;
  title: string;
  roles: UserRole[];
}

export interface UserFilterRoleSectionProps {
  selectedRoles?: UserRole[];
  onRoleChange: (role: UserRole, checked: boolean) => void;
}

export interface UserFilterStatusSectionProps {
  selectedStatuses?: UserStatus[];
  onStatusChange: (status: UserStatus, checked: boolean) => void;
}

export interface UserFilterAuthSectionProps {
  selectedAuthStatuses?: AuthStatus[];
  onAuthStatusChange: (authStatus: AuthStatus, checked: boolean) => void;
}

export interface UserFilterVerificationSectionProps {
  title: string;
  icon: ReactNode;
  idPrefix: string;
  value?: boolean;
  onChange: (verified: boolean | undefined) => void;
}

export interface UserFilterLocationSectionProps {
  locations?: string[];
  onAdd: (location: string) => void;
  onRemove: (location: string) => void;
}
