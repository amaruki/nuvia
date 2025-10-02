import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { EmptyState } from "../ui/EmptyState"
import { CreditCard } from "lucide-react"

export function FinanceWidget() {
  return (
    <WidgetContainer
      type="finance"
      title="Finance Overview"
      description="Membership payments and financial status"
      size="medium"
      empty={true}
      emptyMessage="No financial data"
    >
      <EmptyState
        title="No Financial Data"
        description="Information about membership payments, revenue, and financial status will be displayed here."
        icon={<CreditCard className="h-12 w-12 text-gray-400" />}
      />
    </WidgetContainer>
  )
}