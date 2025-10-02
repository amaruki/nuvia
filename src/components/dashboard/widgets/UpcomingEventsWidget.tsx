"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Calendar } from "lucide-react"

export function UpcomingEventsWidget() {
  return (
    <WidgetContainer
      type="upcoming-events"
      title="Upcoming Events"
      description="Events you're registered for"
      size="large"
      empty={true}
      emptyMessage="No upcoming events"
    >
      <EmptyState
        title="No Upcoming Events"
        description="Events you're registered for will be displayed here with quick check-in options."
        icon={<Calendar className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}