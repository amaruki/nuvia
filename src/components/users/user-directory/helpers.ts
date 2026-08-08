import { AuthStatus, UserStatus } from "@/types/user-management.types";
import type { UserFilter, UserSort } from "@/types/user-management.types";
import { ROLE_DISPLAY_INFO, isPredefinedRole } from "@/types/role";

export const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)", icon: "↑" },
  { value: "name-desc", label: "Name (Z-A)", icon: "↓" },
  { value: "createdAt-desc", label: "Newest First", icon: "🆕" },
  { value: "createdAt-asc", label: "Oldest First", icon: "📅" },
  { value: "userRole-asc", label: "Role ↑", icon: "👤" },
  { value: "userRole-desc", label: "Role ↓", icon: "👤" },
  { value: "status-asc", label: "Status ↑", icon: "🔵" },
  { value: "status-desc", label: "Status ↓", icon: "🔵" },
  { value: "lastLoginAt-desc", label: "Recent Login", icon: "🕐" },
  { value: "lastLoginAt-asc", label: "Last Login", icon: "🕐" },
];

export function parseSortValue(value: string): UserSort {
  const [field, direction] = value.split("-") as [UserSort["field"], "asc" | "desc"];
  return { field, direction };
}

export function getSortValue(sort: UserSort): string {
  return `${sort.field}-${sort.direction}`;
}

export function getActiveFiltersCount(filters: UserFilter): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.roles?.length) count++;
  if (filters.statuses?.length) count++;
  if (filters.authStatuses?.length) count++;
  if (filters.emailVerified !== undefined) count++;
  if (filters.phoneVerified !== undefined) count++;
  if (filters.locations?.length) count++;
  if (filters.registrationDateRange) count++;
  if (filters.lastLoginRange) count++;
  return count;
}

export function getStatusColor(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700";
    case UserStatus.INACTIVE:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700";
    case UserStatus.SUSPENDED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700";
    case UserStatus.PENDING_VERIFICATION:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700";
    case UserStatus.BANNED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export function getAuthStatusColor(authStatus: AuthStatus): string {
  switch (authStatus) {
    case AuthStatus.VERIFIED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700";
    case AuthStatus.UNVERIFIED:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700";
    case AuthStatus.TWO_FACTOR_ENABLED:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700";
    case AuthStatus.TWO_FACTOR_DISABLED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export function getRoleColor(role: string): string {
  if (isPredefinedRole(role)) {
    const displayInfo = ROLE_DISPLAY_INFO[role];
    switch (displayInfo.color) {
      case "red":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700";
      case "orange":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700";
      case "green":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700";
      case "cyan":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700";
      case "blue":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700";
      case "indigo":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700";
      case "purple":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700";
      case "pink":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-700";
      case "slate":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700";
      case "zinc":
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700";
      case "gray":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700";
      case "amber":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700";
      case "rose":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  }
  return "bg-secondary text-secondary-foreground border-border";
}

export function getRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (isPredefinedRole(role)) {
    const displayInfo = ROLE_DISPLAY_INFO[role];
    switch (displayInfo.category) {
      case "administrative":
        return "destructive";
      case "leadership":
      case "staff":
        return "default";
      case "membership":
        return "secondary";
      default:
        return "outline";
    }
  }
  return "outline";
}

export function getStatusAccent(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "border-l-green-500";
    case UserStatus.INACTIVE:
      return "border-l-gray-500";
    case UserStatus.SUSPENDED:
      return "border-l-orange-500";
    case UserStatus.PENDING_VERIFICATION:
      return "border-l-yellow-500";
    case UserStatus.BANNED:
      return "border-l-red-500";
    default:
      return "border-l-muted";
  }
}

export function formatDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
