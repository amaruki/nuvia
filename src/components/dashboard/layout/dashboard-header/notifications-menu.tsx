"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsWidget } from "@/components/dashboard/widgets/notifications-widget";
import { Bell } from "lucide-react";
import type { Notification } from "@/types/dashboard.types";

interface NotificationsMenuProps {
  notificationCount: number;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
  onViewAllNotifications?: () => void;
}

export function NotificationsMenu({
  notificationCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onViewAllNotifications,
}: NotificationsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-semibold flex items-center justify-center rounded-full"
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <NotificationsWidget
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onDismiss={onDismiss}
          onViewAll={onViewAllNotifications}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
