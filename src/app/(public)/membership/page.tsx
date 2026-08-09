/**
 * Public membership funnel (UI-33, decision D10).
 *
 * Server-rendered catalog of the ACTIVE tiers (public projection — no admin
 * internals) with per-tier join CTAs. The track is resolved once here from
 * the configured payment gateway:
 *  - stripe → the CTA starts a real hosted checkout,
 *  - manual → honest offline-payment copy + the application dialog.
 * The page never claims a payment happened; activation follows the verified
 * webhook (stripe) or a reviewer decision (manual).
 */

import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listPublicTiers,
  selectJoinTrack,
  type PublicMembershipTier,
} from "@/lib/services/membership-join.service";
import { formatBillingPeriod, formatTierPrice } from "./_components/format";
import { JoinTierCta } from "./_components/join-tier-cta";

export const dynamic = "force-dynamic";

export default async function PublicMembershipPage() {
  const [tiers, track] = await Promise.all([listPublicTiers(), Promise.resolve(selectJoinTrack())]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero */}
        <div className="text-center py-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Membership
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Become a member</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the tier that fits you.{" "}
            {track === "stripe"
              ? "Pay securely online and your membership activates as soon as your payment is confirmed."
              : "Online payment is not set up for this organization yet — apply and the membership team will arrange payment and activation with you."}
          </p>
        </div>

        {/* Tier catalog */}
        {tiers.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">No membership tiers available</h2>
            <p className="text-muted-foreground">
              Membership is not open for enrollment right now. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} track={track} />
            ))}
          </div>
        )}

        {/* Honest process note */}
        <div className="mt-12 rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
          {track === "stripe" ? (
            <p>
              After checkout, your membership becomes active once the payment provider confirms your
              payment. Until then your enrollment is pending — you will not see yourself as a member
              yet.
            </p>
          ) : (
            <p>
              How it works: submit an application, pay by bank transfer or check, and the membership
              team activates your tier after confirming your payment. No payment is collected on
              this website.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TierCard({ tier, track }: { tier: PublicMembershipTier; track: "stripe" | "manual" }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{tier.displayName}</span>
          {tier.trialDays > 0 && <Badge variant="secondary">{tier.trialDays}-day trial</Badge>}
        </CardTitle>
        <div className="flex items-baseline">
          <span className="text-3xl font-semibold">{formatTierPrice(tier.price)}</span>
          <span className="text-sm text-muted-foreground ml-1">
            {tier.billingCycle === "lifetime" ? "" : `/ ${formatBillingPeriod(tier.billingCycle)}`}
          </span>
        </div>
        {tier.description && <p className="text-sm text-muted-foreground">{tier.description}</p>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {tier.features.length > 0 && (
          <ul className="space-y-2 text-sm flex-1">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
        <JoinTierCta tierId={tier.id} tierName={tier.displayName} track={track} />
      </CardContent>
    </Card>
  );
}
