import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, Link2 as Linkedin } from "lucide-react"; // lucide-react v1 dropped brand icons — see TODO.md
import { UserStatus } from "@/types/user-management.types";
import type { UserProfile } from "@/types/user-management.types";
import { cn } from "@/lib/utils";
import { getInitials } from "./helpers";

interface UserDetailModalHeaderProps {
  user: UserProfile;
}

export default function UserDetailModalHeader({ user }: UserDetailModalHeaderProps) {
  return (
    <DialogHeader>
      <div className="flex items-center gap-4">
        <Avatar className="size-16 ring-2 ring-background shadow-md">
          <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
          {/* Same contrast fix as member-card: the gradient tint +
              text-primary was ~1.9:1 on light backgrounds (axe
              color-contrast); solid primary + primary-foreground is ~11:1
              in both themes. */}
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
            {getInitials(user.firstName || "", user.lastName || "")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <DialogTitle className="text-xl">
            {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1">
            @{user.username}
            <div
              className={cn(
                "size-2 rounded-full",
                user.status === UserStatus.ACTIVE ? "bg-green-500" : "bg-gray-500",
              )}
            />
            {user.status.replace("_", " ").charAt(0).toUpperCase() +
              user.status.replace("_", " ").slice(1)}
          </DialogDescription>
        </div>

        <div className="flex gap-2">
          {user.website && (
            <Button variant="outline" size="sm" asChild>
              <a href={user.website} target="_blank" rel="noopener noreferrer">
                <Globe className="size-4" />
              </a>
            </Button>
          )}
          {user.linkedin && (
            <Button variant="outline" size="sm" asChild>
              <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </DialogHeader>
  );
}
