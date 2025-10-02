import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { FileText } from "lucide-react"

export function RecentArticlesWidget() {
  return (
    <WidgetContainer
      type="recent-articles"
      title="Recent Articles"
      description="Latest articles and announcements"
      size="large"
      empty={true}
      emptyMessage="No recent articles"
    >
      <EmptyState
        title="No Recent Articles"
        description="The latest articles and announcements from the community will be displayed here."
        icon={<FileText className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}