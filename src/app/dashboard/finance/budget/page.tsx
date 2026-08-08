"use client";

import { useEffect } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useHeader } from "@/contexts/dashboard-context";

/**
 * C4: budget dashboard.
 *
 * The membership schema has NO budget tables (see src/db/schema/membership.ts —
 * only tiers, subscriptions, transactions, invoices, invoice items, payments
 * and webhook events). There is no budget store to read from, and this page
 * refuses to invent one. It renders an honest empty state instead of the mock
 * data it previously shipped with. When budget tracking lands, wire it here.
 */
export default function FinanceBudget() {
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Budget Management",
      description: "Budget planning, categories, and spend tracking",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Wallet className="h-10 w-10 text-muted-foreground" />}
            title="Budgeting is not set up yet"
            description="There are no budget tables in the membership schema, so there is no budget data to show. Budget categories, allocations and transactions will appear here once a budget store is added — nothing on this page is mocked."
          />
        </CardContent>
      </Card>
    </div>
  );
}
