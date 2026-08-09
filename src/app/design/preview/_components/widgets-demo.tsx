"use client";

import { CalendarDays, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";

import { AsyncContent } from "@/components/ui/async-content";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetContainer } from "@/components/ui/widget-container";
import { WidgetHeader } from "@/components/ui/widget-header";

export function WidgetsDemo() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">Stat widgets</h3>
          <p className="text-muted-foreground max-w-3xl text-sm">
            WidgetContainer supplies the card frame, header, and the loading and empty handling.
            WidgetHeader adds the period subheading with an action button and the settings
            affordance. Pattern copied from the dashboard stats overview.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <WidgetContainer
            type="member-statistics"
            title="Members"
            description="Registered accounts"
            size="small"
          >
            <div className="space-y-4">
              <WidgetHeader
                title="This month"
                action={{ label: "Directory", onClick: () => undefined }}
              />
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,284</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    +8% from last month
                  </p>
                </div>
              </div>
            </div>
          </WidgetContainer>

          <WidgetContainer type="finance" title="Revenue" description="Monthly intake" size="small">
            <div className="space-y-4">
              <WidgetHeader
                title="This month"
                action={{ label: "Report", onClick: () => undefined }}
              />
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Wallet className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Rp 42,800,000</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    +12% from last month
                  </p>
                </div>
              </div>
            </div>
          </WidgetContainer>

          <WidgetContainer
            type="upcoming-events"
            title="Events"
            description="Scheduled this month"
            size="small"
          >
            <div className="space-y-4">
              <WidgetHeader
                title="This month"
                action={{ label: "Schedule", onClick: () => undefined }}
              />
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />2 fewer than last month
                  </p>
                </div>
              </div>
            </div>
          </WidgetContainer>
        </div>
        <p className="text-muted-foreground text-xs">
          All numbers above are demo data for pattern review only, including the trend notes. They
          are not read from the database.
        </p>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">Async content states</h3>
          <p className="text-muted-foreground max-w-3xl text-sm">
            AsyncContent renders exactly one treatment: a spinner while isLoading is true, a
            destructive alert with a retry action when an error message is set, and the children
            otherwise.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Loading</CardTitle>
              <CardDescription>isLoading is true, so children stay hidden</CardDescription>
            </CardHeader>
            <CardContent>
              <AsyncContent isLoading>
                <p className="text-muted-foreground text-sm">
                  Rendered only after loading completes.
                </p>
              </AsyncContent>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Destructive alert with a retry action</CardDescription>
            </CardHeader>
            <CardContent>
              <AsyncContent
                isLoading={false}
                error="Demo error: the member summary could not be loaded."
                onRetry={() => undefined}
              >
                <p className="text-muted-foreground text-sm">Hidden by the error treatment.</p>
              </AsyncContent>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success</CardTitle>
              <CardDescription>Loaded children render directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AsyncContent isLoading={false} error={null}>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span>Dewi Kusuma</span>
                    <Badge variant="secondary">active</Badge>
                  </li>
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span>Arif Rahman</span>
                    <Badge variant="outline">pending</Badge>
                  </li>
                  <li className="flex items-center justify-between gap-2 text-sm">
                    <span>Siti Rahma</span>
                    <Badge variant="secondary">active</Badge>
                  </li>
                </ul>
              </AsyncContent>
              <p className="text-muted-foreground text-xs">
                Demo payload for pattern review only, not real member records.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
