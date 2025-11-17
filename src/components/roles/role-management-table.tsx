/**
 * Role Management Table
 *
 * Table component for managing user roles with inline editing,
 * bulk operations, and role assignment features.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MoreHorizontal, User, Shield, Settings, Search, Users } from 'lucide-react';
import { Role, ROLE_DISPLAY_INFO } from '@/types/role.types';
import { UserWithRoleInfo } from '@/lib/services/role.service';

// Props interface
interface RoleManagementTableProps {
  users?: UserWithRoleInfo[];
  loading?: boolean;
  onRefresh?: () => void;
  onRoleChange?: (userId: string, newRole: Role, reason?: string) => Promise<void>;
  onBulkRoleChange?: (userIds: string[], newRole: Role, reason?: string) => Promise<void>;
  currentUserRole?: Role;
}

export function RoleManagementTable({
  users = [],
  loading = false,
  onRefresh,
  onRoleChange,
  onBulkRoleChange,
  currentUserRole = 'user'
}: RoleManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleUpdateDialog, setRoleUpdateDialog] = useState<{
    open: boolean;
    userId?: string;
    currentRole?: Role;
    newRole?: Role;
  }>({ open: false });
  const [bulkRoleDialog, setBulkRoleDialog] = useState<{
    open: boolean;
    newRole?: Role;
  }>({ open: false });
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle individual role change
  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!onRoleChange) return;

    setIsUpdating(true);
    try {
      await onRoleChange(userId, newRole, reason);
      setRoleUpdateDialog({ open: false });
      setReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update role:', error);
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
      setReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update roles:', error);
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
      newRole: user.role
    });
  };

  // Open bulk role change dialog
  const openBulkRoleChangeDialog = () => {
    if (selectedUsers.length === 0) return;
    setBulkRoleDialog({ open: true });
  };

  // Check if role change is allowed
  const canChangeRole = (targetRole: Role): boolean => {
    // Implement role hierarchy logic here
    // For now, allow all changes (server will validate)
    return true;
  };

  const getRoleBadgeVariant = (role: Role): "default" | "secondary" | "destructive" | "outline" => {
    if (role === 'superadmin') return 'destructive';
    if (role === 'admin') return 'default';
    if (['staff', 'treasurer', 'chapter_president'].includes(role)) return 'default';
    return 'outline';
  };

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. {filteredUsers.length} of {users.length} users shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          </div>

          {/* Bulk actions */}
          {selectedUsers.length > 0 && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4"
                  onClick={openBulkRoleChangeDialog}
                >
                  Change Role
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear Selection
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.displayName || user.name || user.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {user.permissions.length} permissions
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openRoleChangeDialog(user)}>
                          <User className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          View Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          View History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual Role Change Dialog */}
      <Dialog open={roleUpdateDialog.open} onOpenChange={(open) => setRoleUpdateDialog({ ...roleUpdateDialog, open })}>
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
              <Select
                value={roleUpdateDialog.newRole}
                onValueChange={(value) => setRoleUpdateDialog({ ...roleUpdateDialog, newRole: value as Role })}
              >
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
            </div>
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why is this role change necessary?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleUpdateDialog({ open: false })}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => roleUpdateDialog.userId && roleUpdateDialog.newRole && handleRoleChange(roleUpdateDialog.userId, roleUpdateDialog.newRole)}
              disabled={isUpdating || !roleUpdateDialog.newRole || roleUpdateDialog.newRole === roleUpdateDialog.currentRole}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Role Change Dialog */}
      <Dialog open={bulkRoleDialog.open} onOpenChange={(open) => setBulkRoleDialog({ ...bulkRoleDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Role Update</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}.
              This action will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkNewRole">New Role</Label>
              <Select
                value={bulkRoleDialog.newRole}
                onValueChange={(value) => setBulkRoleDialog({ ...bulkRoleDialog, newRole: value as Role })}
              >
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
            </div>
            <div>
              <Label htmlFor="bulkReason">Reason (Optional)</Label>
              <Textarea
                id="bulkReason"
                placeholder="Why is this bulk role change necessary?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkRoleDialog({ open: false })}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRoleChange}
              disabled={isUpdating || !bulkRoleDialog.newRole || selectedUsers.length === 0}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update {selectedUsers.length} Role{selectedUsers.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}