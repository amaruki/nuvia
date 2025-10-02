import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { CalendarDays } from "lucide-react"

export function EventActivityWidget() {
  return (
    <WidgetContainer
      type="event-activity"
      title="Event Activity"
      description="Overview of event registrations and check-ins"
      size="medium"
      empty={true}
      emptyMessage="No event activity data"
    >
      <EmptyState
        title="No Event Activity"
        description="Statistics about event registrations, check-ins, and overall event activity will be displayed here."
        icon={<CalendarDays className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}