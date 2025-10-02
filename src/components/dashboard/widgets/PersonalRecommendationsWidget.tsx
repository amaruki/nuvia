import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Sparkles } from "lucide-react"

export function PersonalRecommendationsWidget() {
  return (
    <WidgetContainer
      type="personal-recommendations"
      title="Recommended for You"
      description="Personalized recommendations based on your interests"
      size="medium"
      empty={true}
      emptyMessage="No recommendations available"
    >
      <EmptyState
        title="No Recommendations"
        description="Personalized recommendations for events, articles, and community activities will appear here."
        icon={<Sparkles className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}