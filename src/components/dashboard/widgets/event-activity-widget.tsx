"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { Card, CardContent } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../../ui/badge";
import { Calendar, Users, UserCheck, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { EventActivity } from "@/types/dashboard.types";

interface EventActivityWidgetProps {
  eventActivity?: EventActivity;
  onExportData?: () => void;
  onViewAllEvents?: () => void;
}

// Mock event activity data - in a real app, this would come from an API
const mockEventActivity: EventActivity = {
  totalEvents: 24,
  upcomingEvents: 5,
  registrationsThisMonth: 87,
  checkInsToday: 12,
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

const calculatePercentage = (part: number, total: number) => {
  return Math.round((part / total) * 100);
};

export function EventActivityWidget({
  eventActivity = mockEventActivity,
  onExportData,
  onViewAllEvents,
}: EventActivityWidgetProps) {
  const upcomingPercentage = calculatePercentage(
    eventActivity.upcomingEvents,
    eventActivity.totalEvents,
  );

  return (
    <WidgetContainer
      type="event-activity"
      title="Event Activity"
      description="Overview of community events"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {formatNumber(eventActivity.totalEvents)} total events
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={onExportData} className="text-xs">
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={onViewAllEvents} className="text-xs">
                  View all
                </Button>
              </div>
            </div>

            {/* Statistics cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Events */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-chart-1" />
                    <span className="text-sm font-medium text-foreground/70">Total</span>
                  </div>
                  <Badge className="bg-chart-1/20 text-chart-1">100%</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatNumber(eventActivity.totalEvents)}
                </div>
                <div className="text-xs text-foreground/50 mt-1">All events to date</div>
              </div>

              {/* Upcoming Events */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-chart-2" />
                    <span className="text-sm font-medium text-foreground/70">Upcoming</span>
                  </div>
                  <Badge className="bg-chart-2/20 text-chart-2">{upcomingPercentage}%</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatNumber(eventActivity.upcomingEvents)}
                </div>
                <div className="flex items-center text-xs text-chart-3 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+2 from last week</span>
                </div>
              </div>

              {/* Registrations This Month */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-chart-3" />
                    <span className="text-sm font-medium text-foreground/70">Registrations</span>
                  </div>
                  <Badge className="bg-chart-3/20 text-chart-3">This Month</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatNumber(eventActivity.registrationsThisMonth)}
                </div>
                <div className="flex items-center text-xs text-chart-3 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+15% from last month</span>
                </div>
              </div>

              {/* Check-ins Today */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-chart-4" />
                    <span className="text-sm font-medium text-foreground/70">Check-ins</span>
                  </div>
                  <Badge className="bg-chart-4/20 text-chart-4">Today</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatNumber(eventActivity.checkInsToday)}
                </div>
                <div className="flex items-center text-xs text-destructive mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>-5% from yesterday</span>
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Upcoming Events</span>
                  <span>{upcomingPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-chart-2 h-2 rounded-full"
                    style={{ width: `${upcomingPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Registration Rate</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-chart-3 h-2 rounded-full" style={{ width: `78%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Attendance Rate</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-chart-4 h-2 rounded-full" style={{ width: `65%` }}></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="text-xs text-foreground/50 text-center pt-2">
              Event data updated in real-time. Last updated: Today at 10:30 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
