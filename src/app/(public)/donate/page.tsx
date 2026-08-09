/**
 * UI-34 — public donation page (session optional).
 *
 * Honest by construction: this deployment has NO donation schema — the
 * membership schema tracks dues only. So instead of a fake donation form,
 * the page renders the capability report from
 * src/lib/services/finance/member-donations.ts: what is missing, and what
 * supporters CAN do today (become a member; members manage their dues at
 * /dashboard/my/finance). When a donation store is added, implement it in
 * that service and this page grows a real flow — no schema invented here.
 */

import Link from "next/link";
import { ArrowRight, HandHeart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDonationCapability } from "@/lib/services/finance";

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  const capability = getDonationCapability();
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6">
        {/* Hero */}
        <div className="py-12 text-center">
          <Badge className="mb-4" variant="secondary">
            <HandHeart className="mr-1 h-3 w-3" aria-hidden="true" />
            Support us
          </Badge>
          <h1 className="mb-4 text-4xl font-bold">Donate</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Thank you for wanting to support our work. Here is exactly what is possible today: no
            forms that pretend otherwise.
          </p>
        </div>

        {/* Honest capability report */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Online donations are not available yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{capability.reason}</p>
            <p>
              We would rather tell you that than show a donation button that does nothing. When
              online donations open, this page will say so, and only then.
            </p>
          </CardContent>
        </Card>

        {/* What supporters CAN do today */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">What you can do today</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {capability.alternatives.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                <span className="flex items-center justify-between gap-2 font-medium">
                  {option.label}
                  <ArrowRight
                    className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>

          {currentUser && (
            <p className="text-sm text-muted-foreground">
              Signed in as {currentUser.displayName ?? currentUser.username}. Your dues and invoices
              live under{" "}
              <Link href="/dashboard/my/finance" className="underline underline-offset-4">
                My Finance
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
