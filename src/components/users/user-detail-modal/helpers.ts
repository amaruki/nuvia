import { AuthStatus, UserStatus } from "@/types/user-management.types";

export function getStatusColor(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "bg-success/15 text-success border-success/25";
    case UserStatus.INACTIVE:
      return "bg-muted text-muted-foreground border-border";
    case UserStatus.SUSPENDED:
      return "bg-warning/15 text-warning border-warning/25";
    case UserStatus.PENDING_VERIFICATION:
      return "bg-warning/15 text-warning border-warning/25";
    case UserStatus.BANNED:
      return "bg-destructive/15 text-destructive border-destructive/25";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export function getAuthStatusColor(authStatus: AuthStatus): string {
  switch (authStatus) {
    case AuthStatus.VERIFIED:
      return "bg-info/15 text-info border-info/25";
    case AuthStatus.UNVERIFIED:
      return "bg-muted text-muted-foreground border-border";
    case AuthStatus.TWO_FACTOR_ENABLED:
      return "bg-info/15 text-info border-info/25";
    case AuthStatus.TWO_FACTOR_DISABLED:
      return "bg-warning/15 text-warning border-warning/25";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-destructive/15 text-destructive border-destructive/25";
    case "moderator":
      return "bg-info/15 text-info border-info/25";
    case "member":
      return "bg-success/15 text-success border-success/25";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}
