import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { Award } from "lucide-react"

export function CertificatesWidget() {
  return (
    <WidgetContainer
      type="certificates"
      title="Certificates"
      description="Your event participation certificates"
      size="medium"
      empty={true}
      emptyMessage="No certificates available"
    >
      <EmptyState
        title="No Certificates"
        description="Certificates from events you've participated in will be displayed here for download."
        icon={<Award className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}