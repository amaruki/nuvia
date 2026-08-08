/**
 * Role Management Toolbar
 *
 * Header card for the role management table: search and refresh
 * controls plus the bulk selection action bar.
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

interface RoleManagementToolbarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onRefresh?: () => void;
  shownCount: number;
  totalCount: number;
  selectedCount: number;
  onOpenBulkRoleChange: () => void;
  onClearSelection: () => void;
}

export function RoleManagementToolbar({
  searchTerm,
  onSearchTermChange,
  onRefresh,
  shownCount,
  totalCount,
  selectedCount,
  onOpenBulkRoleChange,
  onClearSelection,
}: RoleManagementToolbarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Role Management
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions. {shownCount} of {totalCount} users shown.
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
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>

        {/* Bulk actions */}
        {selectedCount > 0 && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              {selectedCount} user{selectedCount !== 1 ? "s" : ""} selected
              <Button size="sm" variant="outline" className="ml-4" onClick={onOpenBulkRoleChange}>
                Change Role
              </Button>
              <Button size="sm" variant="ghost" className="ml-2" onClick={onClearSelection}>
                Clear Selection
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
