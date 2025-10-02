"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { Users, UserCheck, UserPlus, UserX, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { MemberStatistics } from "@/types/dashboard.types"

interface MemberStatisticsWidgetProps {
  statistics?: MemberStatistics
  onExportData?: () => void
  onViewAllMembers?: () => void
}

// Mock statistics data - in a real app, this would come from an API
const mockStatistics: MemberStatistics = {
  totalMembers: 1245,
  activeMembers: 987,
  newMembersThisMonth: 42,
  expiredMemberships: 18,
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num)
}

const calculatePercentage = (part: number, total: number) => {
  return Math.round((part / total) * 100)
}

export function MemberStatisticsWidget({
  statistics = mockStatistics,
  onExportData,
  onViewAllMembers,
}: MemberStatisticsWidgetProps) {
  const activePercentage = calculatePercentage(statistics.activeMembers, statistics.totalMembers)
  const newPercentage = calculatePercentage(statistics.newMembersThisMonth, statistics.totalMembers)
  const expiredPercentage = calculatePercentage(statistics.expiredMemberships, statistics.totalMembers)
  
  return (
    <WidgetContainer
      type="member-statistics"
      title="Member Statistics"
      description="Overview of community membership"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formatNumber(statistics.totalMembers)} total members
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
                  onClick={onViewAllMembers}
                  className="text-xs"
                >
                  View all
                </Button>
              </div>
            </div>
            
            {/* Statistics cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Members */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Total</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    100%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.totalMembers)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  All registered members
                </div>
              </div>
              
              {/* Active Members */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {activePercentage}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.activeMembers)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+5% from last month</span>
                </div>
              </div>
              
              {/* New Members */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">New</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {newPercentage}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.newMembersThisMonth)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>
              
              {/* Expired Memberships */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserX className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Expired</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    {expiredPercentage}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.expiredMemberships)}
                </div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>-3% from last month</span>
                </div>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Active Members</span>
                  <span>{activePercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${activePercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>New Members (This Month)</span>
                  <span>{newPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${newPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Expired Memberships</span>
                  <span>{expiredPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${expiredPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Membership data updated daily. Last updated: Today at 9:00 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}