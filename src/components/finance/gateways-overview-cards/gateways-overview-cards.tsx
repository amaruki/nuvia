"use client";

import type { GatewaysOverviewCardsProps } from "./types";
import { ActiveGatewaysCard, SuccessRateCard, TotalFeesCard, TotalVolumeCard } from "./stat-cards";
import { GatewayHealthCard } from "./gateway-health-card";
import { TopPerformingGatewaysCard } from "./top-performing-card";
import { PaymentMethodsCard } from "./payment-methods-card";

export function GatewaysOverviewCards({ statistics }: GatewaysOverviewCardsProps) {
  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <TotalVolumeCard statistics={statistics} />
        <SuccessRateCard statistics={statistics} />
        <TotalFeesCard statistics={statistics} />
        <ActiveGatewaysCard statistics={statistics} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Gateway Status Breakdown */}
        <GatewayHealthCard statistics={statistics} />

        {/* Top Performing Gateways */}
        <TopPerformingGatewaysCard statistics={statistics} />

        {/* Payment Methods */}
        <PaymentMethodsCard statistics={statistics} />
      </div>
    </div>
  );
}
