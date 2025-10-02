import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { BarChart3 } from "lucide-react"

export function AnalyticsWidget() {
  return (
    <WidgetContainer
      type="analytics"
      title="Analytics Overview"
      description="Community engagement and activity metrics"
      size="large"
      empty={true}
      emptyMessage="No analytics data"
    >
      <EmptyState
        title="No Analytics Data"
        description="Community engagement metrics, activity statistics, and other analytics will be displayed here."
        icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}