"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  UserCheck,
  Plus,
  ArrowRight,
  Award
} from "lucide-react";
import { Event, EventRegistration, EventStatistics } from "@/types/event.types";
import { getEventDashboardData, getEventStatistics } from "@/lib/services/event.service";
import { EventListLayout } from "@/components/events/EventListLayout";

export default function EventDashboardPage() {
  const [dashboardData, setDashboardData] = React.useState<{
    upcomingEvents: Event[];
    myEvents: Event[];
    myRegistrations: { event: Event; registration: EventRegistration }[];
    eventStatistics: EventStatistics;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch dashboard data
        const data = await getEventDashboardData();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isEventToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isEventTomorrow = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground/90 mb-2">Dashboard Error</h1>
          <p className="text-foreground/60">
            {error || "Failed to load dashboard data. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  const { upcomingEvents, myEvents, myRegistrations, eventStatistics } = dashboardData;

  return (
    <EventListLayout
      title="Event Dashboard"
      description="Overview of your events and activities"
      icon={<Calendar className="h-8 w-8 text-primary" />}
    >
      <div className="flex justify-end mb-8">
        <Button onClick={() => window.location.href = "/events/create"}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg mr-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60">Total Events</p>
                <p className="text-2xl font-bold text-foreground/90">
                  {eventStatistics.totalEvents}
                </p>
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
                <p className="text-2xl font-bold text-foreground/90">
                  {eventStatistics.upcomingEvents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60">Registrations</p>
                <p className="text-2xl font-bold text-foreground/90">
                  {eventStatistics.totalRegistrations}
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
                  {Math.round(eventStatistics.averageAttendanceRate)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Events</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/events"}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-foreground/50">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-foreground/40" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-start p-3 border rounded-lg hover:bg-background transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground/90">{event.title}</h3>
                      <div className="flex items-center text-sm text-foreground/50 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-foreground/50 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatTime(event.startDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-foreground/50 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      {isEventToday(event.startDate) && (
                        <Badge className="bg-info/20 text-info">Today</Badge>
                      )}
                      {isEventTomorrow(event.startDate) && (
                        <Badge className="bg-purple-100 text-purple-800">Tomorrow</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>My Registrations</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/events/certificates"}
              >
                Certificates
                <Award className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myRegistrations.length === 0 ? (
              <div className="text-center py-8 text-foreground/50">
                <Users className="h-12 w-12 mx-auto mb-2 text-foreground/40" />
                <p>No event registrations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRegistrations.slice(0, 3).map(({ event, registration }) => (
                  <div key={registration.id} className="flex items-start p-3 border rounded-lg hover:bg-background transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground/90">{event.title}</h3>
                      <div className="flex items-center text-sm text-foreground/50 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-foreground/50 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatTime(event.startDate)}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <Badge 
                        className={
                          registration.status === "confirmed" 
                            ? "bg-chart-2/20 text-success"
                            : registration.status === "pending"
                            ? "bg-warning/20 text-warning"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {registration.status}
                      </Badge>
                      {registration.checkedInAt && (
                        <Badge className="bg-info/20 text-info mt-1">
                          Checked In
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Events (Organizer) */}
      {myEvents.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Events I'm Organizing</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/events"}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="border rounded-lg overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-white/30" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                      <h3 className="text-white font-medium truncate">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-sm text-foreground/50 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    <div className="flex items-center text-sm text-foreground/50 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge 
                        className={
                          event.status === "published"
                            ? "bg-chart-2/20 text-success"
                            : event.status === "draft"
                            ? "bg-warning/20 text-warning"
                            : event.status === "cancelled"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-info/20 text-info"
                        }
                      >
                        {event.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/events/${event.id}`}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </EventListLayout>
  );
}