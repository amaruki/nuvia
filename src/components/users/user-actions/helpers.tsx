import { Ban, Key, LogOut, Mail, Phone, Shield, ShieldCheck, UserCheck } from "lucide-react";
import { logger } from "@/lib/logger";
import type { BulkAction } from "./types";

// DEBUG: Log bulk action creation
export function getBulkActions({
  isAdmin,
  isModerator,
}: {
  isAdmin: boolean;
  isModerator: boolean;
}): BulkAction[] {
  logger.info("DEBUG: Creating bulk actions array");

  return [
    {
      type: "activate",
      label: "Activate Users",
      description: "Reactivate suspended or inactive user accounts",
      icon: <UserCheck className="size-4" />,
      variant: "default",
    },
    {
      type: "verify_email",
      label: "Verify Email",
      description: "Manually verify user email addresses",
      icon: <Mail className="size-4" />,
      variant: "outline",
    },
    {
      type: "verify_phone",
      label: "Verify Phone",
      description: "Manually verify user phone numbers",
      icon: <Phone className="size-4" />,
      variant: "outline",
    },
    // DEBUG: Log conditional moderator actions
    ...(isModerator
      ? (() => {
          logger.info("DEBUG: Adding moderator actions");
          return [
            {
              type: "suspend",
              label: "Suspend Users",
              description: "Temporarily suspend user accounts",
              icon: <Shield className="size-4" />,
              variant: "default",
              requiresReason: true,
            } as BulkAction,
          ];
        })()
      : (() => {
          logger.info("DEBUG: Skipping moderator actions");
          return [];
        })()),
    ...(isAdmin
      ? (() => {
          logger.info("DEBUG: Adding admin actions");
          return [
            {
              type: "change_role",
              label: "Change Role",
              description: "Update user roles and permissions",
              icon: <ShieldCheck className="size-4" />,
              variant: "outline",
              requiresRole: true,
            } as BulkAction,
            {
              type: "reset_password",
              label: "Reset Password",
              description: "Send password reset emails to users",
              icon: <Key className="size-4" />,
              variant: "outline",
            } as BulkAction,
            {
              type: "force_logout",
              label: "Force Logout",
              description: "End all active user sessions",
              icon: <LogOut className="size-4" />,
              variant: "outline",
            } as BulkAction,
            {
              type: "ban",
              label: "Ban Users",
              description: "Permanently ban user accounts",
              icon: <Ban className="size-4" />,
              variant: "destructive",
              requiresReason: true,
            } as BulkAction,
          ];
        })()
      : []),
  ];
}
