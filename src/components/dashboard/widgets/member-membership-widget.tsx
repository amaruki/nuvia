/**
 * UI-31 — Membership card widget (member home).
 *
 * Renders the member's real subscription facts from
 * `getMembershipCard` — derived status, tier, and renewal date. When the
 * caller has no subscription it renders the honest "Not a member yet" state
 * with a join CTA instead of inventing benefits. Every CTA points at the
 * real join/renew funnel (`/membership`, UI-33).
 *
 * Server component: it only presents data the server already fetched and
 * links out — no interactivity of its own.
 */

import Link from "next/link";
import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MembershipCardData } from "@/lib/services/member/home";
import { resolveMembershipCardState, type RenewalKind } from "./member-home-states";
import { formatDate } from "@/lib/utils/date-utils";

interface MemberMembershipWidgetProps {
  card: MembershipCardData | null;
}

const MEMBER_STATUS_BADGES: Record<
  MembershipCardData["memberStatus"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  active: { label: "Active", variant: "default" },
  trialing: { label: "Trial", variant: "secondary" },
  in_grace: { label: "Winding down", variant: "outline" },
  paused: { label: "Paused", variant: "outline" },
  expired: { label: "Expired", variant: "destructive" },
  none: { label: "Not a member", variant: "secondary" },
};

function renewalSentence(kind: RenewalKind, date: Date | null): string | null {
  if (date === null) return null;
  const formatted = formatDate(date, "MMM d, yyyy");
  switch (kind) {
    case "renews":
      return `Renews on ${formatted}`;
    case "ends":
      return `Ends on ${formatted}`;
    case "trial_ends":
      return `Trial ends on ${formatted}`;
    case "none":
      return null;
  }
}

export function MemberMembershipWidget({ card }: MemberMembershipWidgetProps) {
  const state = resolveMembershipCardState(card);
  const badge = MEMBER_STATUS_BADGES[state.state === "non_member" ? "none" : state.state];
  const renewal = renewalSentence(state.renewalKind, state.renewalDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden />
          Membership
        </CardTitle>
        <CardDescription>{state.headline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          {card?.tierDisplayName ? (
            <span className="text-sm text-muted-foreground">{card.tierDisplayName}</span>
          ) : null}
        </div>

        {card ? (
          <dl className="space-y-1 text-sm">
            {card.tierBillingCycle ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Billing cycle</dt>
                <dd className="capitalize">{card.tierBillingCycle}</dd>
              </div>
            ) : null}
            {renewal ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Renewal</dt>
                <dd>{renewal}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have a membership yet. Join to unlock member benefits.
          </p>
        )}

        <Button asChild variant={state.state === "non_member" ? "default" : "outline"} size="sm">
          <Link href={state.ctaHref}>{state.ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
