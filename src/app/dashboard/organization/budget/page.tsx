import { PiggyBank } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

/**
 * Nav lists this surface for treasurer and committee chairs
 * (src/lib/navigation-data/organization.ts), but the schema has no budget
 * tables, so the page reports that instead of fabricating figures.
 */
export default function OrganizationBudget() {
  return (
    <div className="space-y-6">
      <PageHeader title="Committee Budgets" description="Allocations and spend per committee." />
      <Card>
        <EmptyState
          icon={<PiggyBank className="size-8 text-muted-foreground" aria-hidden="true" />}
          title="No budget module yet"
          description="This module is not built: the database has no budget, allocation, or committee-spend tables, so there is nothing to plan or report here. Recorded money movement lives under Invoices in the Finance section."
        />
      </Card>
    </div>
  );
}
