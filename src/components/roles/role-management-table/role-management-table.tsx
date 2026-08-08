/**
 * Role Management Table
 *
 * Table component for managing user roles with inline editing,
 * bulk operations, and role assignment features.
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import type { Role, UserWithRoleInfo } from "@/types/role";
import { BulkRoleChangeDialog, RoleUpdateDialog } from "./role-change-dialogs";
import { RoleManagementToolbar } from "./role-management-toolbar";
import type { BulkRoleDialogState, RoleManagementTableProps, RoleUpdateDialogState } from "./types";
import { UsersTable } from "./users-table";

export function RoleManagementTable({
  users = [],
  loading = false,
  onRefresh,
  onRoleChange,
  onBulkRoleChange,
}: RoleManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleUpdateDialog, setRoleUpdateDialog] = useState<RoleUpdateDialogState>({
    open: false,
  });
  const [bulkRoleDialog, setBulkRoleDialog] = useState<BulkRoleDialogState>({ open: false });
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle individual role change
  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!onRoleChange) return;

    setIsUpdating(true);
    try {
      await onRoleChange(userId, newRole, reason);
      setRoleUpdateDialog({ open: false });
      setReason("");
      onRefresh?.();
    } catch (error) {
      logger.error("Failed to update role", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk role change
  const handleBulkRoleChange = async () => {
    if (!onBulkRoleChange || !bulkRoleDialog.newRole || selectedUsers.length === 0) return;

    setIsUpdating(true);
    try {
      await onBulkRoleChange(selectedUsers, bulkRoleDialog.newRole, reason);
      setBulkRoleDialog({ open: false });
      setSelectedUsers([]);
      setReason("");
      onRefresh?.();
    } catch (error) {
      logger.error("Failed to update roles", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open role change dialog for individual user
  const openRoleChangeDialog = (user: UserWithRoleInfo) => {
    setRoleUpdateDialog({
      open: true,
      userId: user.id,
      currentRole: user.role,
      newRole: user.role,
    });
  };

  // Open bulk role change dialog
  const openBulkRoleChangeDialog = () => {
    if (selectedUsers.length === 0) return;
    setBulkRoleDialog({ open: true });
  };

  // Selection handlers for the users table
  const handleSelectAll = () => setSelectedUsers(filteredUsers.map((user) => user.id));
  const handleDeselectAll = () => setSelectedUsers([]);
  const handleSelectUser = (userId: string) => setSelectedUsers([...selectedUsers, userId]);
  const handleDeselectUser = (userId: string) =>
    setSelectedUsers(selectedUsers.filter((id) => id !== userId));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and bulk actions */}
      <RoleManagementToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onRefresh={onRefresh}
        shownCount={filteredUsers.length}
        totalCount={users.length}
        selectedCount={selectedUsers.length}
        onOpenBulkRoleChange={openBulkRoleChangeDialog}
        onClearSelection={handleDeselectAll}
      />

      {/* Users table */}
      <UsersTable
        users={filteredUsers}
        selectedUsers={selectedUsers}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onSelectUser={handleSelectUser}
        onDeselectUser={handleDeselectUser}
        onChangeRole={openRoleChangeDialog}
      />

      {/* Individual Role Change Dialog */}
      <RoleUpdateDialog
        open={roleUpdateDialog.open}
        currentRole={roleUpdateDialog.currentRole}
        newRole={roleUpdateDialog.newRole}
        reason={reason}
        isUpdating={isUpdating}
        onOpenChange={(open) => setRoleUpdateDialog({ ...roleUpdateDialog, open })}
        onNewRoleChange={(newRole) => setRoleUpdateDialog({ ...roleUpdateDialog, newRole })}
        onReasonChange={setReason}
        onCancel={() => setRoleUpdateDialog({ open: false })}
        onSubmit={() => {
          if (roleUpdateDialog.userId && roleUpdateDialog.newRole) {
            void handleRoleChange(roleUpdateDialog.userId, roleUpdateDialog.newRole);
          }
        }}
      />

      {/* Bulk Role Change Dialog */}
      <BulkRoleChangeDialog
        open={bulkRoleDialog.open}
        newRole={bulkRoleDialog.newRole}
        selectedCount={selectedUsers.length}
        reason={reason}
        isUpdating={isUpdating}
        onOpenChange={(open) => setBulkRoleDialog({ ...bulkRoleDialog, open })}
        onNewRoleChange={(newRole) => setBulkRoleDialog({ ...bulkRoleDialog, newRole })}
        onReasonChange={setReason}
        onCancel={() => setBulkRoleDialog({ open: false })}
        onSubmit={() => void handleBulkRoleChange()}
      />
    </div>
  );
}
