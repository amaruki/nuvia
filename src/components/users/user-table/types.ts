import type { UserProfile, UserSort } from "@/types/user-management.types";

export interface UserTableProps {
  users: UserProfile[];
  selectedUsers: string[];
  onSelectUser: (userId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  sort: UserSort;
  onSort: (sort: UserSort) => void;
  showSelection?: boolean;
  className?: string;
}
