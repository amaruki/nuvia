"use client";

import { RefreshCw, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/role";

interface RolesPageHeaderProps {
  currentUserRole: Role;
  loading: boolean;
  onRefresh: () => void;
}

export function RolesPageHeader({ currentUserRole, loading, onRefresh }: RolesPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">
          Manage user roles, permissions, and access control for your organization.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          Current Role: {currentUserRole}
        </Badge>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
