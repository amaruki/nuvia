import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Search } from "lucide-react"

export function GlobalSearchWidget() {
  return (
    <WidgetContainer
      type="global-search"
      title="Global Search"
      description="Search across the entire platform"
      size="wide"
      empty={true}
      emptyMessage="Search functionality coming soon"
    >
      <EmptyState
        title="Global Search"
        description="Search functionality for finding articles, events, members, and other content across the platform will be available here."
        icon={<Search className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}