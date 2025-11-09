"use client";

import * as React from "react"
import { WidgetContainer } from "../../ui/widget-container"
import { Card, CardContent } from "../../ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "../../ui/badge"
import { Bell, Check, CheckCheck, ExternalLink, X } from "lucide-react"
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
  switch (type) {
    case "announcement":
      return <Bell className="h-4 w-4" style={{ color: 'var(--primary)' }} />
    case "comment-reply":
      return <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'var(--chart-2)' }}></div>
    case "mention":
      return <div className="h-4 w-4 rounded-full bg-chart-4"></div>
    case "event-reminder":
      return <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'var(--destructive)' }}></div>
    default:
      return <Bell className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
  }
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
    <WidgetContainer
      type="notifications"
      title="Notifications"
      description={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  {unreadCount} unread
                </span>
              </div>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAll}
                  className="text-xs"
                >
                  View all
                </Button>
              </div>
            </div>
            
            {/* Notifications list */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                  <Bell className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--muted-foreground)', opacity: '0.4' }} />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read
                        ? "bg-card border-border"
                        : "bg-info/10 border-info/30"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium truncate ${
                            notification.read ? "" : ""
                          }`} style={{ color: 'var(--foreground)' }}>
                            {notification.title}
                            {!notification.read && (
                              <Badge className="ml-2 text-xs" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                                New
                              </Badge>
                            )}
                          </h4>
                          <div className="flex space-x-1 ml-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMarkAsRead?.(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDismiss?.(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: '0.4' }}>
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 p-0" style={{ color: 'var(--primary)' }}
                              asChild
                            >
                              <a href={notification.actionUrl}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}