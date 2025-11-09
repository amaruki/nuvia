"use client";

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Bell, Check, ExternalLink, X } from "lucide-react"
import { Notification } from "@/types/dashboard.types"

interface NotificationsWidgetProps {
  notifications?: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDismiss?: (id: string) => void
  onViewAll?: () => void
}

// Mock notifications data - in a real app, this would come from an API
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "announcement",
    title: "Community Meeting",
    message: "Join us for our monthly community meeting this Saturday at 2 PM.",
    createdAt: new Date("2023-10-01T10:30:00"),
    read: false,
    actionUrl: "/events/community-meeting",
  },
  {
    id: "2",
    type: "comment-reply",
    title: "New reply to your comment",
    message: "John Doe replied to your comment on the 'Best Practices' post.",
    createdAt: new Date("2023-10-01T09:15:00"),
    read: false,
    actionUrl: "/forum/best-practices#comment-123",
  },
  {
    id: "3",
    type: "mention",
    title: "You were mentioned",
    message: "Jane Smith mentioned you in the 'Project Updates' discussion.",
    createdAt: new Date("2023-09-30T16:45:00"),
    read: true,
    actionUrl: "/forum/project-updates#comment-456",
  },
  {
    id: "4",
    type: "event-reminder",
    title: "Event Reminder",
    message: "Don't forget about the 'Web Development Workshop' tomorrow at 10 AM.",
    createdAt: new Date("2023-09-30T14:20:00"),
    read: true,
    actionUrl: "/events/web-dev-workshop",
  },
]

const getNotificationIcon = (type: string) => {
  return <Bell className="h-4 w-4 text-muted-foreground" />
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return "Just now"
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }
}

export function NotificationsWidget({
  notifications = mockNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onViewAll,
}: NotificationsWidgetProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="w-full">
      {/* Simple header */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-medium text-muted-foreground">
            {unreadCount} unread
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            Mark all read
          </Button>
        </div>
      )}
  
      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                  !notification.read ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium text-foreground leading-tight ${
                        !notification.read ? "font-semibold" : ""
                      }`}>
                        {notification.title}
                      </h4>

                      {!notification.read && (
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsRead?.(notification.id)}
                            className="h-6 w-6 p-0 hover:bg-muted"
                          >
                            <Check className="h-3 w-3" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDismiss?.(notification.id)}
                            className="h-6 w-6 p-0 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Dismiss</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/60">
                        {formatDate(notification.createdAt)}
                      </span>

                      {notification.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary hover:text-primary/80 h-6 p-0"
                          asChild
                        >
                          <a href={notification.actionUrl} className="flex items-center gap-1">
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  )
}