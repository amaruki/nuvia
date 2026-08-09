"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { GatewayStatisticsCardProps } from "./types";

export function GatewayHealthCard({ statistics }: GatewayStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2 flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Gateway Health</CardTitle>
        <CardDescription>Real-time status distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center gap-4">
        {/* Status Item: Active */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Active</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            {statistics.activeGateways}
          </Badge>
        </div>

        {/* Status Item: Testing */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Testing</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-amber-50 text-amber-700 border-amber-200"
          >
            {statistics.testingGateways}
          </Badge>
        </div>

        {/* Status Item: Inactive */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <XCircle className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Inactive</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-slate-50 text-slate-700 border-slate-200"
          >
            {statistics.inactiveGateways}
          </Badge>
        </div>

        {/* Status Item: Error */}
        <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Error</span>
          </div>
          <Badge
            variant="outline"
            className="text-sm font-bold bg-rose-50 text-rose-700 border-rose-200"
          >
            {statistics.errorGateways}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
