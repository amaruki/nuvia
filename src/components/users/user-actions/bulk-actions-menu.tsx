"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BulkAction } from "./types";

interface BulkActionsMenuProps {
  actions: BulkAction[];
  onActionClick: (action: BulkAction) => void;
}

export function BulkActionsMenu({ actions, onActionClick }: BulkActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          Bulk Actions
          <Badge variant="secondary" className="ml-2 min-w-[20px] h-5">
            {actions.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.type}
            onClick={() => onActionClick(action)}
            className={cn(
              "gap-3 p-3 cursor-pointer",
              action.variant === "destructive" && "text-destructive focus:text-destructive",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center size-8 rounded-full",
                action.variant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : action.variant === "default"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {action.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium">{action.label}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </div>
            {action.requiresReason && <AlertTriangle className="size-4 text-muted-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
