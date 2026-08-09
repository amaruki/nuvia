import type { ReactNode } from "react";

export interface UserActionsProps {
  selectedUsers: string[];
  onClearSelection: () => void;
  currentUserRole?: string;
  className?: string;
}

export interface BulkAction {
  type: "change_role";
  label: string;
  description: string;
  icon: ReactNode;
  variant: "default" | "destructive" | "outline";
  requiresReason?: boolean;
  requiresRole?: boolean;
}
