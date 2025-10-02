import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Bell } from "lucide-react"

export function NotificationsWidget() {
  return (
    <WidgetContainer
      type="notifications"
      title="Notifications"
      description="Latest announcements and updates"
      size="medium"
      empty={true}
      emptyMessage="No notifications available"
    >
      <EmptyState
        title="No Notifications"
        description="Your latest notifications, announcements, and reminders will appear here."
        icon={<Bell className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}