import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { User, Crown, AlertCircle } from "lucide-react"

export function UserProfileWidget() {
  return (
    <WidgetContainer
      type="user-profile"
      title="Profile"
      description="Your membership information"
      size="medium"
      empty={true}
      emptyMessage="Profile information will be displayed here"
    >
      <EmptyState
        title="Profile Information"
        description="Your profile details, membership tier, and status will be displayed here."
        icon={<User className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}