import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { MessageSquare } from "lucide-react"

export function CommunityActivityWidget() {
  return (
    <WidgetContainer
      type="community-activity"
      title="Community Activity"
      description="Latest forum posts and discussions"
      size="large"
      empty={true}
      emptyMessage="No community activity"
    >
      <EmptyState
        title="No Community Activity"
        description="The latest forum posts, discussions, and community interactions will be displayed here."
        icon={<MessageSquare className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}