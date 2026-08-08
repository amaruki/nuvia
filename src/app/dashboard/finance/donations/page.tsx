"use client";

import { useEffect } from "react";
import { HandHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useHeader } from "@/contexts/dashboard-context";

/**
 * C4: donations dashboard.
 *
 * The membership schema has NO donation tables (see src/db/schema/membership.ts —
 * only tiers, subscriptions, transactions, invoices, invoice items, payments
 * and webhook events). Membership dues are the only money the ledger tracks.
 * There is no donation store to read from, so this page renders an honest
 * empty state instead of the mock data it previously shipped with.
 */
export default function FinanceDonations() {
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Donations & Fundraising",
      description: "Manage donations, campaigns, and fundraising activities",
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
            icon={<HandHeart className="h-10 w-10 text-muted-foreground" />}
            title="Donations are not tracked yet"
            description="The membership ledger only tracks dues — there are no donation or campaign tables in the schema. Donations, campaigns and receipts will appear here once a donation store is added — nothing on this page is mocked."
          />
        </CardContent>
      </Card>
    </div>
  );
}
