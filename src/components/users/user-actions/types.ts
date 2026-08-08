import type { ReactNode } from "react";

export interface UserActionsProps {
  selectedUsers: string[];
  onClearSelection: () => void;
  currentUserRole?: string;
  className?: string;
}

export interface BulkAction {
  type:
    | "activate"
    | "suspend"
    | "ban"
    | "unban"
    | "change_role"
    | "verify_email"
    | "verify_phone"
    | "reset_password"
    | "force_logout";
  label: string;
  description: string;
  icon: ReactNode;
  variant: "default" | "destructive" | "outline";
  requiresReason?: boolean;
  requiresRole?: boolean;
}
