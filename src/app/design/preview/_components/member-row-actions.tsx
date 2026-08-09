"use client";

import { Copy, MoreHorizontal, Pencil, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { DemoMember } from "./demo-members";

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MemberRowActions({ member }: { member: DemoMember }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          aria-label={`Actions for ${member.name}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => toast(`Open profile: ${member.name} (demo)`)}>
          <User aria-hidden="true" />
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast(`Edit member: ${member.name} (demo)`)}>
          <Pencil aria-hidden="true" />
          Edit member
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast(`Copied ${member.email} (demo)`)}>
          <Copy aria-hidden="true" />
          Copy email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => toast(`Delete request for ${member.name} (demo)`)}
        >
          Delete member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
