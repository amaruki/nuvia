"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { EmptyState } from "../../ui/empty-state";
import { BarChart3 } from "lucide-react";

/**
 * UI-01: the platform has no analytics/telemetry data source, so this widget
 * renders an honest empty state. The previous version shipped hardcoded
 * visitor/page-view numbers as if they were real — that mock data and its
 * fake trends were removed rather than kept behind optional props nobody
 * fills with real values.
 *
 * UI-11 chart a11y: no hand-built div bars remain here to retrofit (UI-01
 * removed them), so no progressbar semantics are needed today. When an
 * analytics source is connected, build charts with shadcn chart (plan
 * decision D5); any interim div bars must carry role="progressbar" with
 * aria-valuenow/min/max and an accessible name — enforced by
 * tests/a11y-manual-fixes.test.ts.
 */
export function AnalyticsWidget() {
  return (
    <WidgetContainer
      type="analytics"
      title="Website Analytics"
      description="Visitor engagement and behavior metrics"
      size="medium"
    >
      <EmptyState
        icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
        title="Analytics not connected"
        description="No analytics source is configured for this organization yet. Visitor and engagement metrics will appear here once one is connected."
      />
    </WidgetContainer>
  );
}
