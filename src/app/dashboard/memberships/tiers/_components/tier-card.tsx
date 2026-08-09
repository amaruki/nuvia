"use client";

import { Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBillingPeriod, formatTierPrice, type TierDto } from "./tiers-api";

interface TierCardProps {
  tier: TierDto;
  /** Real ACTIVE-subscription count for this tier (0 when none). */
  memberCount: number;
  onManage: (tier: TierDto) => void;
}

export function TierCard({ tier, memberCount, onManage }: TierCardProps) {
  return (
    <Card className="border bg-card transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-1">{tier.displayName}</CardTitle>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold">{formatTierPrice(tier.price)}</span>
              <span className="text-sm text-muted-foreground ml-1">
                {tier.billingCycle === "lifetime"
                  ? ""
                  : `/${formatBillingPeriod(tier.billingCycle)}`}
              </span>
            </div>
          </div>
          <Badge variant={tier.isActive ? "default" : "secondary"} className="text-xs">
            {tier.isActive ? "active" : "inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Active members</span>
          <span className="font-medium">{memberCount.toLocaleString()}</span>
        </div>

        <div className="text-sm text-muted-foreground line-clamp-2">
          {tier.description || "No description provided."}
        </div>

        {tier.features.length > 0 && (
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
            {tier.features.slice(0, 3).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" size="sm" onClick={() => onManage(tier)}>
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
