import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Star } from "lucide-react"

export function CommunityHighlightsWidget() {
  return (
    <WidgetContainer
      type="community-highlights"
      title="Community Highlights"
      description="Featured content and community milestones"
      size="large"
      empty={true}
      emptyMessage="No community highlights"
    >
      <EmptyState
        title="No Community Highlights"
        description="Featured posts, new member spotlights, community milestones, and other highlights will be displayed here."
        icon={<Star className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}