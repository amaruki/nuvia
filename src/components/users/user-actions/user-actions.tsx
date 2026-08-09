"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type UserRole } from "@/types/dashboard.types";
import { roleHasPermission } from "@/types/role";
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
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("member");

  // The only bulk operation backed by a real API is the bulk role update
  // (POST /api/v1/admin/users/bulk-role-update, requires users:update).
  const canChangeRoles = roleHasPermission(currentUserRole, "users:update");
  const bulkActions = canChangeRoles ? getBulkActions() : [];

  const handleActionClick = (action: BulkAction) => {
    setSelectedAction(action);
    setReason("");
    setShowConfirmDialog(true);
  };

  const resetDialogState = () => {
    setShowConfirmDialog(false);
    setSelectedAction(null);
    setReason("");
    setNewRole("member");
  };

  const handleConfirmAction = async () => {
    if (!selectedAction || selectedAction.type !== "change_role" || selectedUsers.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/v1/admin/users/bulk-role-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUsers,
          role: newRole,
          reason: reason.trim() || "Bulk role update by administrator",
          confirm: true,
        }),
      });

      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          typeof body === "object" && body !== null && "detail" in body && body.detail
            ? String(body.detail)
            : "Failed to update roles";
        toast.error(detail);
        return;
      }

      const message =
        typeof body === "object" && body !== null && "message" in body && body.message
          ? String(body.message)
          : "Role update completed";
      toast.success(message);

      resetDialogState();
      onClearSelection();
      void queryClient.invalidateQueries({ queryKey: ["user-directory"] });
    } catch {
      toast.error("Failed to update roles");
    }
  };

  const handleCancelAction = () => {
    resetDialogState();
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
                  Change the role of the selected users
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClearSelection} className="gap-1">
                <X className="size-4" />
                Clear Selection
              </Button>

              {bulkActions.length > 0 && (
                <BulkActionsMenu actions={bulkActions} onActionClick={handleActionClick} />
              )}
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
        onConfirm={() => void handleConfirmAction()}
        onCancel={handleCancelAction}
      />
    </>
  );
}
