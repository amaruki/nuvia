"use client";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type UserRole } from "@/types/dashboard.types";
import type { BulkAction } from "./types";

interface ConfirmActionDialogProps {
  open: boolean;
  action: BulkAction | null;
  selectedUsers: string[];
  reason: string;
  newRole: UserRole;
  onReasonChange: (reason: string) => void;
  onRoleChange: (role: UserRole) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionDialog({
  open,
  action,
  selectedUsers,
  reason,
  newRole,
  onReasonChange,
  onRoleChange,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {action?.icon}
            {action?.label}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will be applied to {selectedUsers.length} selected{" "}
            {selectedUsers.length === 1 ? "user" : "users"}.
            {action?.requiresReason && " Please provide a reason for this action."}
            {action?.requiresRole && " Please select the new role for these users."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Selection */}
          {action?.requiresRole && (
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={(value) => onRoleChange(value as UserRole)}>
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
          {action?.requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter a reason for this action..."
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
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
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              action?.variant === "destructive" && "bg-destructive hover:bg-destructive/90",
            )}
          >
            {action?.requiresReason && !reason && "Add Reason & "}
            {action?.requiresRole && !newRole && "Select Role & "}
            Confirm Action
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
