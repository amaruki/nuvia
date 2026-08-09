"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SWATCHES = [
  { name: "background", className: "bg-background border border-border" },
  { name: "foreground", className: "bg-foreground" },
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  { name: "destructive", className: "bg-destructive" },
  { name: "chart-1", className: "bg-chart-1" },
  { name: "chart-2", className: "bg-chart-2" },
  { name: "chart-3", className: "bg-chart-3" },
  { name: "chart-4", className: "bg-chart-4" },
  { name: "chart-5", className: "bg-chart-5" },
];

export function TokensDemo() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Color tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {SWATCHES.map((swatch) => (
              <div key={swatch.name} className="space-y-1.5">
                <div className={`h-12 rounded-lg ${swatch.className}`} />
                <p className="text-muted-foreground font-mono text-[11px]">--{swatch.name}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Defined once in globals.css for light and dark. Components only reference token classes,
            so the DarkModeToggle in the header above flips every surface on this page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-4xl font-semibold tracking-tight">Display 4xl</p>
          <p className="text-2xl font-semibold tracking-tight">Heading 2xl</p>
          <p className="text-lg font-medium">Body large</p>
          <p className="text-sm">Body default, the size most of the app uses.</p>
          <p className="text-muted-foreground text-xs">
            Caption and helper text, always muted through the token, never a hardcoded gray.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motion tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">--ease-out (0.23, 1, 0.32, 1)</Badge>
            <Badge variant="outline">--ease-drawer (0.32, 0.72, 0, 1)</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              key={replayKey}
              className="landing-rise border-border bg-muted flex h-24 items-center justify-center rounded-lg border text-sm"
            >
              Entrance: landing-rise, 0.7s
            </div>
            <div className="landing-hover border-border bg-card flex h-24 items-center justify-center rounded-lg border text-sm">
              Hover me: landing-hover
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setReplayKey((key) => key + 1)}>
              <RotateCcw aria-hidden="true" />
              Replay entrance
            </Button>
            <p className="text-muted-foreground text-xs">
              Under prefers-reduced-motion, movement is dropped and only opacity remains
              (plans/001).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
