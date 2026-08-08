"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { type UserRole } from "@/types/dashboard.types";
import { BulkActionsMenu } from "./bulk-actions-menu";
import { ConfirmActionDialog } from "./confirm-action-dialog";
import { getBulkActions } from "./helpers";
import type { BulkAction, UserActionsProps } from "./types";

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

  const bulkActions = getBulkActions({ isAdmin, isModerator });

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

              <BulkActionsMenu actions={bulkActions} onActionClick={handleActionClick} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={showConfirmDialog}
        action={selectedAction}
        selectedUsers={selectedUsers}
        reason={reason}
        newRole={newRole}
        onReasonChange={setReason}
        onRoleChange={setNewRole}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
}
