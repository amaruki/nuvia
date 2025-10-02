import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { FileText } from "lucide-react"

export function RecentContentWidget() {
  return (
    <WidgetContainer
      type="recent-content"
      title="Recent Content"
      description="Latest articles and announcements"
      size="medium"
      empty={true}
      emptyMessage="No recent content"
    >
      <EmptyState
        title="No Recent Content"
        description="The latest articles, announcements, and other content published on the platform will be displayed here."
        icon={<FileText className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}