import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/user-management.types";
import {
  formatDate,
  getAuthStatusColor,
  getInitials,
  getRoleColor,
  getStatusColor,
} from "./helpers";

interface UserTableRowProps {
  user: UserProfile;
  showSelection: boolean;
  isSelected: boolean;
  isFocused: boolean;
  onSelectUser: (userId: string, checked: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export default function UserTableRow({
  user,
  showSelection,
  isSelected,
  isFocused,
  onSelectUser,
  onKeyDown,
  onFocus,
  onBlur,
}: UserTableRowProps) {
  return (
    <TableRow
      className={cn(
        "border-b transition-colors hover:bg-muted/50 cursor-pointer",
        isFocused && "bg-muted/50 ring-2 ring-primary ring-inset ring-offset-0",
        isSelected && "bg-muted/30",
      )}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {showSelection && (
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${user.firstName} ${user.lastName}`}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
              {getInitials(user.firstName || "", user.lastName || "")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate">
                {user.firstName} {user.lastName}
              </div>
              {user.username && (
                <span className="text-sm text-muted-foreground truncate">@{user.username}</span>
              )}
            </div>
            {user.bio && (
              <div className="text-sm text-muted-foreground truncate max-w-[200px]">{user.bio}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          className={cn("text-xs font-semibold px-2 py-0.5", getRoleColor(user.userRole))}
          variant="outline"
        >
          {user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge
            className={cn(
              "text-xs font-semibold px-2 py-0.5 w-full justify-center",
              getStatusColor(user.status),
            )}
            variant="outline"
          >
            {user.status.replace("_", " ").charAt(0).toUpperCase() +
              user.status.replace("_", " ").slice(1)}
          </Badge>
          <Badge
            className={cn(
              "text-xs px-2 py-0.5 w-full justify-center",
              getAuthStatusColor(user.authStatus),
            )}
            variant="outline"
          >
            {user.authStatus === "two_factor_enabled"
              ? "2FA"
              : user.authStatus.charAt(0).toUpperCase() + user.authStatus.slice(1)}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <Mail className="size-3 text-muted-foreground" />
            <span className="truncate max-w-[120px]">{user.email}</span>
            {user.emailVerified && (
              <div className="size-3 rounded-full bg-green-500" title="Email verified" />
            )}
          </div>
          {user.phone && (
            <div className="flex items-center gap-1">
              <Phone className="size-3 text-muted-foreground" />
              <span className="truncate max-w-[120px]">{user.phone}</span>
              {user.phoneVerified && (
                <div className="size-3 rounded-full bg-green-500" title="Phone verified" />
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm" title={formatDate(user.createdAt)}>
          {formatDate(user.createdAt)}
        </div>
      </TableCell>
    </TableRow>
  );
}
