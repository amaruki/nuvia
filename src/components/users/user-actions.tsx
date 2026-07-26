"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  X,
  Shield,
  ShieldCheck,
  Ban,
  UserCheck,
  Key,
  Mail,
  Phone,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { type UserRole } from "@/types/dashboard.types";

interface UserActionsProps {
  selectedUsers: string[];
  onClearSelection: () => void;
  currentUserRole?: string;
  className?: string;
}

interface BulkAction {
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
  icon: React.ReactNode;
  variant: "default" | "destructive" | "outline";
  requiresReason?: boolean;
  requiresRole?: boolean;
}

export function UserActions({
  selectedUsers,
  onClearSelection,
  currentUserRole,
  className,
}: UserActionsProps) {
  // DEBUG: Log UserRole type validation
  logger.info("DEBUG: UserRole type validation", {
    currentUserRole,
    isAdmin: currentUserRole === "admin",
    isModerator: currentUserRole === "moderator",
    availableRoles: [
      "member",
      "moderator",
      "admin",
      "superadmin",
      "staff",
      "treasurer",
      "chapter_president",
      "chapter_admin",
      "committee_chair",
      "organizer",
      "member_corporate",
      "member_professional",
      "member_student",
      "user",
    ],
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("member");

  const isAdmin = currentUserRole === "admin";
  const isModerator = currentUserRole === "moderator";

  // DEBUG: Log bulk action creation
  logger.info("DEBUG: Creating bulk actions array");

  const bulkActions: BulkAction[] = [
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

  const handleActionClick = (action: BulkAction) => {
    setSelectedAction(action);
    if (action.requiresRole) {
      // Show role selection dialog first
      setReason("");
      setShowConfirmDialog(true);
    } else {
      setReason("");
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedAction) return;

    // DEBUG: Log validation checks
    logger.info("DEBUG: Validating action requirements", {
      actionType: selectedAction.type,
      requiresReason: selectedAction.requiresReason,
      hasReason: !!reason,
      requiresRole: selectedAction.requiresRole,
      hasRole: !!newRole,
      currentRole: newRole,
    });

    // Validate required fields
    if (selectedAction.requiresReason && !reason.trim()) {
      logger.info("DEBUG: Validation failed - reason required but not provided");
      return;
    }

    if (selectedAction.requiresRole && !newRole) {
      logger.info("DEBUG: Validation failed - role required but not selected");
      return;
    }

    // Here you would implement the actual bulk action
    const actionData = {
      type: selectedAction.type,
      userIds: selectedUsers,
      reason: selectedAction.requiresReason ? reason : undefined,
      newRole: selectedAction.requiresRole ? newRole : undefined,
    };

    logger.info("DEBUG: Performing bulk action", actionData);

    // Reset state
    setShowConfirmDialog(false);
    setSelectedAction(null);
    setReason("");
    setNewRole("member");
    onClearSelection();
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setSelectedAction(null);
    setReason("");
    setNewRole("member");
  };

  return (
    <>
      <Card className={cn("border-2 border-primary/20 bg-primary/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-primary/20">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {selectedUsers.length} {selectedUsers.length === 1 ? "User" : "Users"} Selected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose an action to perform on selected users
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClearSelection} className="gap-1">
                <X className="size-4" />
                Clear Selection
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Bulk Actions
                    <Badge variant="secondary" className="ml-2 min-w-[20px] h-5">
                      {bulkActions.length}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {bulkActions.map((action) => (
                    <DropdownMenuItem
                      key={action.type}
                      onClick={() => handleActionClick(action)}
                      className={cn(
                        "gap-3 p-3 cursor-pointer",
                        action.variant === "destructive" &&
                          "text-destructive focus:text-destructive",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center size-8 rounded-full",
                          action.variant === "destructive"
                            ? "bg-destructive/10 text-destructive"
                            : action.variant === "default"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                      {action.requiresReason && (
                        <AlertTriangle className="size-4 text-muted-foreground" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={handleCancelAction}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedAction?.icon}
              {selectedAction?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will be applied to {selectedUsers.length} selected{" "}
              {selectedUsers.length === 1 ? "user" : "users"}.
              {selectedAction?.requiresReason && " Please provide a reason for this action."}
              {selectedAction?.requiresRole && " Please select the new role for these users."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Role Selection */}
            {selectedAction?.requiresRole && (
              <div className="space-y-2">
                <Label htmlFor="new-role">New Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                  <SelectTrigger id="new-role">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason Input */}
            {selectedAction?.requiresReason && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter a reason for this action..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Selected Users Preview */}
            <div className="space-y-2">
              <Label>Affected Users</Label>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {selectedUsers.length} {selectedUsers.length === 1 ? "user" : "users"} will be
                  affected
                </div>
                <div className="text-xs text-muted-foreground">
                  User IDs: {selectedUsers.slice(0, 3).join(", ")}
                  {selectedUsers.length > 3 && ` and ${selectedUsers.length - 3} more...`}
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={cn(
                selectedAction?.variant === "destructive" &&
                  "bg-destructive hover:bg-destructive/90",
              )}
            >
              {selectedAction?.requiresReason && !reason && "Add Reason & "}
              {selectedAction?.requiresRole && !newRole && "Select Role & "}
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
