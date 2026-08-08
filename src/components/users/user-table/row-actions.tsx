import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  ExternalLink,
  Link2 as Linkedin, // lucide-react v1 dropped brand icons — see TODO.md
  MoreHorizontal,
  Settings,
} from "lucide-react";
import type { UserProfile } from "@/types/user-management.types";

interface UserRowActionsProps {
  user: UserProfile;
}

export default function UserRowActions({ user }: UserRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Actions for ${user.firstName} ${user.lastName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-2">
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Settings className="size-4" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.linkedin && (
          <DropdownMenuItem asChild>
            <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="gap-2">
              <Linkedin className="size-4" />
              LinkedIn
            </a>
          </DropdownMenuItem>
        )}
        {user.website && (
          <DropdownMenuItem asChild>
            <a href={user.website} target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="size-4" />
              Website
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
