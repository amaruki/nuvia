/**
 * Permission Cell
 *
 * Single permission entry in the grid view: toggle checkbox,
 * action/module labels, and granted status icon.
 */

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Lock, Unlock } from "lucide-react";
import type { Permission } from "@/types/role";

import type { PermissionItem } from "./types";

interface PermissionCellProps {
  permission: PermissionItem;
  granted: boolean;
  disabled: boolean;
  onToggle: (permission: Permission, granted: boolean) => void;
}

export function PermissionCell({ permission, granted, disabled, onToggle }: PermissionCellProps) {
  return (
    <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50">
      <Checkbox
        id={permission.id}
        checked={granted}
        onCheckedChange={(checked) => onToggle(permission.id, checked as boolean)}
        disabled={disabled}
      />
      <div className="flex-1 space-y-1">
        <Label
          htmlFor={permission.id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {permission.action}
        </Label>
        <p className="text-xs text-muted-foreground">{permission.module}</p>
      </div>
      {granted ? (
        <Unlock className="h-4 w-4 text-green-600" />
      ) : (
        <Lock className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}
