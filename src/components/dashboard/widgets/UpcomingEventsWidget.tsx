"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { Calendar, MapPin, Clock, CheckCircle, ExternalLink, QrCode } from "lucide-react"
import { Event } from "@/types/dashboard.types"

interface UpcomingEventsWidgetProps {
  events?: Event[]
  onCheckIn?: (eventId: string) => void
  onViewEvent?: (eventId: string) => void
  onViewAllEvents?: () => void
}

// Mock upcoming events data - in a real app, this would come from an API
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Web Development Workshop",
    description: "Learn the latest techniques in modern web development with hands-on workshops and expert guidance.",
    startDate: new Date("2023-10-15T09:00:00"),
    endDate: new Date("2023-10-15T17:00:00"),
    location: "Tech Hub, Building A",
    isRegistered: true,
    isCheckedIn: false,
  },
  {
    id: "2",
    title: "Community Meetup",
    description: "Monthly community gathering to network, share ideas, and discuss the latest trends in technology.",
    startDate: new Date("2023-10-20T18:00:00"),
    endDate: new Date("2023-10-20T21:00:00"),
    location: "Community Center",
    isRegistered: true,
    isCheckedIn: false,
  },
  {
    id: "3",
    title: "React Conference 2023",
    description: "Annual conference featuring the latest updates in React ecosystem and best practices from industry experts.",
    startDate: new Date("2023-11-05T09:00:00"),
    endDate: new Date("2023-11-07T18:00:00"),
    location: "Convention Center",
    isRegistered: true,
    isCheckedIn: false,
  },
  {
    id: "4",
    title: "UI/UX Design Masterclass",
    description: "Intensive masterclass on creating intuitive and beautiful user interfaces and experiences.",
    startDate: new Date("2023-10-25T10:00:00"),
    endDate: new Date("2023-10-25T16:00:00"),
    location: "Design Studio",
    isRegistered: false,
    isCheckedIn: false,
  },
]

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const isEventToday = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const isEventTomorrow = (date: Date) => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  )
}

export function UpcomingEventsWidget({
  events = mockEvents,
  onCheckIn,
  onViewEvent,
  onViewAllEvents,
}: UpcomingEventsWidgetProps) {
  // Sort events by start date (upcoming first)
  const sortedEvents = [...events]
    .filter(event => event.isRegistered)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  
  return (
    <WidgetContainer
      type="upcoming-events"
      title="Upcoming Events"
      description={`${sortedEvents.length} event${sortedEvents.length !== 1 ? 's' : ''} you're registered for`}
      size="large"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {sortedEvents.length} registered events
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllEvents}
                className="text-xs"
              >
                View all
              </Button>
            </div>
            
            {/* Events list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sortedEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No upcoming events</p>
                  <p className="text-sm mt-2">Events you're registered for will be displayed here with quick check-in options.</p>
                </div>
              ) : (
                sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${
                      isEventToday(event.startDate) 
                        ? "bg-blue-50 border-blue-200" 
                        : isEventTomorrow(event.startDate)
                        ? "bg-purple-50 border-purple-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {event.title}
                          </h3>
                          {isEventToday(event.startDate) && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Today
                            </Badge>
                          )}
                          {isEventTomorrow(event.startDate) && (
                            <Badge className="bg-purple-100 text-purple-800">
                              Tomorrow
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Event details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-2" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-2" />
                        <span>
                          {formatTime(event.startDate)} - {formatTime(event.endDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    
                    {/* Event actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {event.isCheckedIn ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCheckIn?.(event.id)}
                            className="text-xs"
                            disabled={!isEventToday(event.startDate)}
                          >
                            <QrCode className="h-3 w-3 mr-1" />
                            Check In
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewEvent?.(event.id)}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Event data updated in real-time. Check-in is only available on the day of the event.
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}