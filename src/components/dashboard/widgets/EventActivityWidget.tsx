"use client"

import * as React from "react"
import { WidgetContainer } from "../../ui/WidgetContainer"
import { Card, CardContent } from "../../ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "../../ui/Badge"
import { Calendar, Users, UserCheck, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { EventActivity } from "@/types/dashboard.types"

interface EventActivityWidgetProps {
  eventActivity?: EventActivity
  onExportData?: () => void
  onViewAllEvents?: () => void
}

// Mock event activity data - in a real app, this would come from an API
const mockEventActivity: EventActivity = {
  totalEvents: 24,
  upcomingEvents: 5,
  registrationsThisMonth: 87,
  checkInsToday: 12,
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num)
}

const calculatePercentage = (part: number, total: number) => {
  return Math.round((part / total) * 100)
}

export function EventActivityWidget({
  eventActivity = mockEventActivity,
  onExportData,
  onViewAllEvents,
}: EventActivityWidgetProps) {
  const upcomingPercentage = calculatePercentage(eventActivity.upcomingEvents, eventActivity.totalEvents)
  
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
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formatNumber(eventActivity.totalEvents)} total events
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExportData}
                  className="text-xs"
                >
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAllEvents}
                  className="text-xs"
                >
                  View all
                </Button>
              </div>
            </div>
            
            {/* Statistics cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Events */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Total</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    100%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(eventActivity.totalEvents)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  All events to date
                </div>
              </div>
              
              {/* Upcoming Events */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Upcoming</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {upcomingPercentage}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(eventActivity.upcomingEvents)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+2 from last week</span>
                </div>
              </div>
              
              {/* Registrations This Month */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Registrations</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    This Month
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(eventActivity.registrationsThisMonth)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+15% from last month</span>
                </div>
              </div>
              
              {/* Check-ins Today */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Check-ins</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Today
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(eventActivity.checkInsToday)}
                </div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>-5% from yesterday</span>
                </div>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Upcoming Events</span>
                  <span>{upcomingPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${upcomingPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Registration Rate</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `78%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Attendance Rate</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `65%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Event data updated in real-time. Last updated: Today at 10:30 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}