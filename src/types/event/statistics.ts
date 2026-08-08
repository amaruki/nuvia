// Event statistics and dashboard types for Nuvia community platform

import { EventType } from "./enums";
import { Event, EventRegistration } from "./event";

export interface EventStatistics {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  averageAttendanceRate: number;
  popularEventTypes: {
    eventType: EventType;
    count: number;
  }[];
  monthlyStats: {
    month: string;
    events: number;
    registrations: number;
  }[];
}

export interface EventDashboardData {
  upcomingEvents: Event[];
  myEvents: Event[]; // Events organized by the current user
  myRegistrations: {
    event: Event;
    registration: EventRegistration;
  }[];
  eventStatistics: EventStatistics;
}
