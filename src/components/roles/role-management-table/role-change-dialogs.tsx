/**
 * Role Change Dialogs
 *
 * Confirmation dialogs for individual and bulk role updates,
 * sharing a common role picker.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { ROLE_DISPLAY_INFO, type Role } from "@/types/role";

interface RoleSelectProps {
  value?: Role;
  onValueChange: (role: Role) => void;
}

// Role picker shared by both role change dialogs
function RoleSelect({ value, onValueChange }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as Role)}>
      <SelectTrigger>
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ROLE_DISPLAY_INFO).map(([role, info]) => (
          <SelectItem key={role} value={role}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {role}
              </Badge>
              <span>{info.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface RoleUpdateDialogProps {
  open: boolean;
  currentRole?: Role;
  newRole?: Role;
  reason: string;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onNewRoleChange: (role: Role) => void;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

// Individual role change dialog
export function RoleUpdateDialog({
  open,
  currentRole,
  newRole,
  reason,
  isUpdating,
  onOpenChange,
  onNewRoleChange,
  onReasonChange,
  onCancel,
  onSubmit,
}: RoleUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for this user. This action will be logged for audit purposes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newRole">New Role</Label>
            <RoleSelect value={newRole} onValueChange={onNewRoleChange} />
          </div>
          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why is this role change necessary?"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isUpdating || !newRole || newRole === currentRole}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BulkRoleChangeDialogProps {
  open: boolean;
  newRole?: Role;
  selectedCount: number;
  reason: string;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onNewRoleChange: (role: Role) => void;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

// Bulk role change dialog
export function BulkRoleChangeDialog({
  open,
  newRole,
  selectedCount,
  reason,
  isUpdating,
  onOpenChange,
  onNewRoleChange,
  onReasonChange,
  onCancel,
  onSubmit,
}: BulkRoleChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Role Update</DialogTitle>
          <DialogDescription>
            Change the role for {selectedCount} selected user{selectedCount !== 1 ? "s" : ""}. This
            action will be logged for audit purposes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bulkNewRole">New Role</Label>
            <RoleSelect value={newRole} onValueChange={onNewRoleChange} />
          </div>
          <div>
            <Label htmlFor="bulkReason">Reason (Optional)</Label>
            <Textarea
              id="bulkReason"
              placeholder="Why is this bulk role change necessary?"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isUpdating || !newRole || selectedCount === 0}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update {selectedCount} Role{selectedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
