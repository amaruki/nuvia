/**
 * Users Table
 *
 * Table card of the role management view: selectable user rows with
 * role badges, permission counts, and per-row actions.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Settings, Shield, User } from "lucide-react";
import type { Role, UserWithRoleInfo } from "@/types/role";

interface UsersTableProps {
  users: UserWithRoleInfo[];
  selectedUsers: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectUser: (userId: string) => void;
  onDeselectUser: (userId: string) => void;
  onChangeRole: (user: UserWithRoleInfo) => void;
}

const getRoleBadgeVariant = (role: Role): "default" | "secondary" | "destructive" | "outline" => {
  if (role === "superadmin") return "destructive";
  if (role === "admin") return "default";
  if (["staff", "treasurer", "chapter_president"].includes(role)) return "default";
  return "outline";
};

export function UsersTable({
  users,
  selectedUsers,
  onSelectAll,
  onDeselectAll,
  onSelectUser,
  onDeselectUser,
  onChangeRole,
}: UsersTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAll();
                    } else {
                      onDeselectAll();
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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectUser(user.id);
                      } else {
                        onDeselectUser(user.id);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {user.displayName || user.name || user.username}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
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
                      <DropdownMenuItem onClick={() => onChangeRole(user)}>
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
  );
}
