"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
} from "@/components/ui/full-calendar";
import { Badge } from "@/components/ui/badge";
import { id } from "date-fns/locale";

import {
  Calendar as CalIcon,
  Clock,
  MapPin,
  Users,
  Filter,
  Plus,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EventDialog } from "./_components/event-dialog";
import { useHeader } from "@/contexts/dashboard-context";

const calendarTabs = [
  {
    id: "calendar",
    label: "Calendar",
    icon: CalIcon,
    description: "View events in calendar format",
  },
  {
    id: "list",
    label: "List View",
    icon: List,
    description: "View events as a list",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    icon: Clock,
    description: "View upcoming events",
  },
  {
    id: "past",
    label: "Past Events",
    icon: Users,
    description: "View past events",
  },
] as const;

type TabId = (typeof calendarTabs)[number]["id"];

// Sample events data
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

const sampleEvents = [
  {
    id: 1,
    title: "Community Meetup",
    date: new Date(2024, 11, 15),
    time: "6:00 PM",
    location: "Community Center",
  },
  {
    id: 2,
    title: "Tech Workshop",
    date: new Date(2024, 11, 22),
    time: "2:00 PM",
    location: "Tech Hub",
  },
  {
    id: 3,
    title: "Holiday Party",
    date: new Date(2024, 11, 25),
    time: "7:00 PM",
    location: "Main Hall",
  },
  {
    id: 4,
    title: "New Year Celebration",
    date: new Date(2025, 0, 1),
    time: "9:00 PM",
    location: "City Park",
  },
  {
    id: 5,
    title: "Morning Yoga",
    date: new Date(2024, 11, 15),
    time: "8:00 AM",
    location: "Wellness Center",
  },
  {
    id: 6,
    title: "Team Meeting",
    date: new Date(currentYear, currentMonth, 20),
    time: "10:00 AM",
    location: "Conference Room",
  },
  {
    id: 7,
    title: "Product Launch",
    date: new Date(currentYear, currentMonth, 25),
    time: "3:00 PM",
    location: "Main Auditorium",
  },
];

// Convert sample events to full-calendar format
function convertEventsToCalendarFormat() {
  const eventColors = ["default", "blue", "green", "pink", "purple"] as const;

  return sampleEvents.map((event, index) => {
    // Parse time and create proper Date objects
    const eventDate = new Date(event.date);
    const time24h =
      event.time.includes("AM") || event.time.includes("PM")
        ? event.time.replace(" AM", "").replace(" PM", "")
        : event.time;

    let hours = parseInt(time24h.split(":")[0]);
    const minutes = parseInt(time24h.split(":")[1] || "0");

    if (event.time.includes("PM") && hours !== 12) {
      hours += 12;
    }
    if (event.time.includes("AM") && hours === 12) {
      hours = 0;
    }

    const startDate = new Date(eventDate);
    startDate.setHours(hours, minutes, 0, 0);

    // Create end date (2 hours after start for demo purposes)
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    return {
      id: event.id.toString(),
      start: startDate,
      end: endDate,
      title: event.title,
      color: eventColors[index % eventColors.length],
    };
  });
}

// Calendar component with real events
// Calendar component with real events
function CalendarView({ onDateClick }: { onDateClick: (date: Date) => void }) {
  const calendarEvents = convertEventsToCalendarFormat();

  return (
    <Calendar
      events={calendarEvents}
      defaultDate={new Date()} // Start in current month to show current events
      view="month"
      onDateClick={onDateClick}
      locale={id}
    >
      <div className="h-[75vh] min-h-[600px] flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <CalendarViewTrigger
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              view="day"
            >
              Day
            </CalendarViewTrigger>
            <CalendarViewTrigger
              view="week"
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Week
            </CalendarViewTrigger>
            <CalendarViewTrigger
              view="month"
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Month
            </CalendarViewTrigger>
            <CalendarViewTrigger
              view="year"
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Year
            </CalendarViewTrigger>
          </div>
          <div className="ml-4 text-lg font-semibold">
            <CalendarCurrentDate />
          </div>

          <div className="flex items-center gap-1 p-1">
            <CalendarPrevTrigger className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </CalendarPrevTrigger>

            <CalendarTodayTrigger className="h-8 px-3 text-xs">Today</CalendarTodayTrigger>

            <CalendarNextTrigger className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </CalendarNextTrigger>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative">
          <CalendarDayView />
          <CalendarWeekView />
          <CalendarMonthView />
          <CalendarYearView />
        </div>
      </div>
    </Calendar>
  );
}

export default function EventsCalendar() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const { setHeader, clearHeader } = useHeader();
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  // Set header and active tab from URL parameter if available
  useEffect(() => {
    // Set the header
    setHeader({
      title: "Events Calendar",
      description: "Manage and monitor community events and activities",
    });
    setIsLoading(false);

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-[1600px] mx-auto ">
      {/* Tabbed Interface */}
      <div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabId)}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              {calendarTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <EventDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                defaultDate={selectedDate}
              >
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </EventDialog>
            </div>
          </div>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6 animate-in fade-in-50 duration-500">
            <CalendarView onDateClick={handleDateClick} />
          </TabsContent>

          {/* List View Tab */}
          <TabsContent value="list" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  All Events
                </CardTitle>
                <CardDescription>Comprehensive list of all community events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px] p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <div className="text-xs text-muted-foreground uppercase font-semibold">
                            {event.date.toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {event.date.getDate()}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-lg">{event.title}</h5>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Events Tab */}
          <TabsContent value="upcoming" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sampleEvents.slice(0, 3).map((event, i) => (
                <Card
                  key={event.id}
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription>
                          {event.date.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                          })}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {i + 1}d
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm mb-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{20 + i * 10} attendees</span>
                      </div>
                    </div>
                    <Button className="w-full">Register Now</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Past Events Tab */}
          <TabsContent value="past" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Event History
                </CardTitle>
                <CardDescription>Archive of previously held community events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16 bg-muted/10 rounded-lg border border-dashed">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-semibold mb-2">No Past Events</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Past events will appear here once they've occurred. Check back later for event
                    archives.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
