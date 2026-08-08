"use client";

import { Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TierData } from "./tiers-types";

interface TierCardProps {
  tier: TierData;
  onManage: (tier: TierData) => void;
  onViewDetails: (tier: TierData) => void;
}

export function TierCard({ tier, onManage, onViewDetails }: TierCardProps) {
  return (
    <Card className="border bg-card transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-1">{tier.name}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{tier.price}</span>
                <span className="text-sm text-muted-foreground ml-1">/{tier.period}</span>
              </div>
              {tier.status === "popular" && (
                <Badge variant="secondary" className="text-xs">
                  Popular
                </Badge>
              )}
            </div>
          </div>
          <Badge variant={tier.status === "active" ? "default" : "secondary"} className="text-xs">
            {tier.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Members</span>
          <span className="font-medium">{tier.memberCount.toLocaleString()}</span>
        </div>

        <div className="text-sm text-muted-foreground line-clamp-2">{tier.description}</div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" size="sm" onClick={() => onManage(tier)}>
            Manage
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onViewDetails(tier)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
