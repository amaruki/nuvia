"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users, Calendar, ExternalLink } from "lucide-react"

interface FinanceWidgetProps {
  totalRevenue?: number
  monthlyRevenue?: number
  pendingPayments?: number
  activeSubscriptions?: number
  onExportData?: () => void
  onViewAllTransactions?: () => void
}

// Mock finance data - in a real app, this would come from an API
const mockFinanceData = {
  totalRevenue: 45680,
  monthlyRevenue: 8450,
  pendingPayments: 1250,
  activeSubscriptions: 342,
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num)
}

const calculatePercentage = (part: number, total: number) => {
  return Math.round((part / total) * 100)
}

export function FinanceWidget({
  totalRevenue = mockFinanceData.totalRevenue,
  monthlyRevenue = mockFinanceData.monthlyRevenue,
  pendingPayments = mockFinanceData.pendingPayments,
  activeSubscriptions = mockFinanceData.activeSubscriptions,
  onExportData,
  onViewAllTransactions,
}: FinanceWidgetProps) {
  const pendingPercentage = calculatePercentage(pendingPayments, monthlyRevenue)
  
  return (
    <WidgetContainer
      type="finance"
      title="Financial Overview"
      description="Revenue and subscription metrics"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(totalRevenue)} total revenue
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
                  onClick={onViewAllTransactions}
                  className="text-xs"
                >
                  View all
                </Button>
              </div>
            </div>
            
            {/* Finance cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Revenue */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Total Revenue</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    All Time
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12% from last quarter</span>
                </div>
              </div>
              
              {/* Monthly Revenue */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Monthly Revenue</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    This Month
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthlyRevenue)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+8% from last month</span>
                </div>
              </div>
              
              {/* Pending Payments */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Pending</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {pendingPercentage}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(pendingPayments)}
                </div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>+3% from last month</span>
                </div>
              </div>
              
              {/* Active Subscriptions */}
              <div className="p-4 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Subscriptions</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    Active
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(activeSubscriptions)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+15 from last month</span>
                </div>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Monthly Revenue Target</span>
                  <span>84%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `84%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pending Payments</span>
                  <span>{pendingPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${pendingPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Subscription Renewal Rate</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `92%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Financial data updated daily. Last updated: Today at 8:00 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}