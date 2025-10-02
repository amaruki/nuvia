"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { BarChart3, TrendingUp, TrendingDown, Users, Eye, MousePointer, Calendar, Clock, ExternalLink } from "lucide-react"

interface AnalyticsWidgetProps {
  totalVisitors?: number
  pageViews?: number
  avgSessionDuration?: number
  bounceRate?: number
  onExportData?: () => void
  onViewFullReport?: () => void
}

// Mock analytics data - in a real app, this would come from an API
const mockAnalyticsData = {
  totalVisitors: 12450,
  pageViews: 34560,
  avgSessionDuration: 245, // in seconds
  bounceRate: 32, // in percentage
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num)
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AnalyticsWidget({
  totalVisitors = mockAnalyticsData.totalVisitors,
  pageViews = mockAnalyticsData.pageViews,
  avgSessionDuration = mockAnalyticsData.avgSessionDuration,
  bounceRate = mockAnalyticsData.bounceRate,
  onExportData,
  onViewFullReport,
}: AnalyticsWidgetProps) {
  const pagesPerSession = pageViews / totalVisitors
  
  return (
    <WidgetContainer
      type="analytics"
      title="Website Analytics"
      description="Visitor engagement and behavior metrics"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formatNumber(totalVisitors)} total visitors
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
                  onClick={onViewFullReport}
                  className="text-xs"
                >
                  Full Report
                </Button>
              </div>
            </div>
            
            {/* Analytics cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Visitors */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Visitors</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Total
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(totalVisitors)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>
              
              {/* Page Views */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Page Views</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    Total
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(pageViews)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+8% from last month</span>
                </div>
              </div>
              
              {/* Avg. Session Duration */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Session</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Average
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(avgSessionDuration)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+15s from last month</span>
                </div>
              </div>
              
              {/* Bounce Rate */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Bounce Rate</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Percentage
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {bounceRate}%
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>-3% from last month</span>
                </div>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Visitor Growth</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `78%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Engagement Rate</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `65%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pages per Session</span>
                  <span>{pagesPerSession.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(pagesPerSession * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Analytics data updated daily. Last updated: Today at 9:00 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}