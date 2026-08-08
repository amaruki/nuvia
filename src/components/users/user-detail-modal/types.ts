import type { UserProfile } from "@/types/user-management.types";

export interface UserDetailModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole?: string;
}
