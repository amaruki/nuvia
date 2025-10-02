import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Compass } from "lucide-react"

export function QuickNavigationWidget() {
  return (
    <WidgetContainer
      type="quick-navigation"
      title="Quick Navigation"
      description="Quick access to platform features"
      size="medium"
      empty={true}
      emptyMessage="Navigation links coming soon"
    >
      <EmptyState
        title="Quick Navigation"
        description="Quick links to core platform features like events, forum, articles, and membership settings will be available here."
        icon={<Compass className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}