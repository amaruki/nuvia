import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Users } from "lucide-react"

export function MemberStatisticsWidget() {
  return (
    <WidgetContainer
      type="member-statistics"
      title="Member Statistics"
      description="Overview of community membership"
      size="medium"
      empty={true}
      emptyMessage="No statistics available"
    >
      <EmptyState
        title="No Member Statistics"
        description="Statistics about community members, including active, new, and expired memberships will be displayed here."
        icon={<Users className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}