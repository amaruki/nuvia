"use client";

import { RefreshCw, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/role";

interface RolesActionBarProps {
  currentUserRole: Role;
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Action bar for the roles page. The title and description live in the
 * dashboard shell header (set via useHeader), so this renders only the
 * contextual actions instead of duplicating the heading.
 */
export function RolesActionBar({ currentUserRole, loading, onRefresh }: RolesActionBarProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Badge variant="outline" className="gap-1">
        <Shield className="h-3 w-3" />
        Current Role: {currentUserRole}
      </Badge>
      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}
