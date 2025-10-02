import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Shield } from "lucide-react"

export function ModerationWidget() {
  return (
    <WidgetContainer
      type="moderation"
      title="Moderation Queue"
      description="Reported content awaiting review"
      size="medium"
      empty={true}
      emptyMessage="No moderation items"
    >
      <EmptyState
        title="No Moderation Items"
        description="Reported comments, forum threads, and other content requiring moderation will be displayed here."
        icon={<Shield className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}