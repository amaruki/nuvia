/**
 * Permission Row
 *
 * Table view row for a single permission: name and description,
 * module badge, action, and grant status toggle.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Permission } from "@/types/role";

import { getPermissionIcon } from "./icons";
import type { PermissionItem } from "./types";

interface PermissionRowProps {
  permission: PermissionItem;
  granted: boolean;
  disabled: boolean;
  onToggle: (permission: Permission, granted: boolean) => void;
}

export function PermissionRow({ permission, granted, disabled, onToggle }: PermissionRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {getPermissionIcon(permission.module)}
          <div>
            <div className="font-medium">{permission.name}</div>
            <div className="text-sm text-muted-foreground">{permission.category.description}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{permission.module}</Badge>
      </TableCell>
      <TableCell>{permission.action}</TableCell>
      <TableCell className="text-center">
        <Checkbox
          checked={granted}
          onCheckedChange={(checked) => onToggle(permission.id, checked as boolean)}
          disabled={disabled}
        />
      </TableCell>
    </TableRow>
  );
}
