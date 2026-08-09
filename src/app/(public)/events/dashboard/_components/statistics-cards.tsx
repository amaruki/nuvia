"use client";

/**
 * Summary statistics cards (totals, upcoming, registrations, attendance)
 * shown at the top of the event dashboard.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, UserCheck, Users } from "lucide-react";
import type { EventStatistics } from "@/types/event";

interface StatisticsCardsProps {
  statistics: EventStatistics;
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">Total Events</p>
              <p className="text-2xl font-bold text-foreground/90">{statistics.totalEvents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-chart-2/10 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">Upcoming</p>
              <p className="text-2xl font-bold text-foreground/90">{statistics.upcomingEvents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-accent rounded-lg mr-4">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">Registrations</p>
              <p className="text-2xl font-bold text-foreground/90">
                {statistics.totalRegistrations}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning/10 rounded-lg mr-4">
              <UserCheck className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">Attendance</p>
              <p className="text-2xl font-bold text-foreground/90">
                {Math.round(statistics.averageAttendanceRate)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
