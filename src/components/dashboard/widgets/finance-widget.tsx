"use client"

import * as React from "react"
import { WidgetContainer } from "../../ui/widget-container"
import { Card, CardContent } from "../../ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "../../ui/badge"
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
                <DollarSign className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
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
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-chart-3" />
                    <span className="text-sm font-medium text-foreground/70">Total Revenue</span>
                  </div>
                  <Badge className="bg-chart-3/20 text-chart-3">
                    All Time
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="flex items-center text-xs text-chart-3 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12% from last quarter</span>
                </div>
              </div>
              
              {/* Monthly Revenue */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-chart-1" />
                    <span className="text-sm font-medium text-foreground/70">Monthly Revenue</span>
                  </div>
                  <Badge className="bg-chart-1/20 text-chart-1">
                    This Month
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatCurrency(monthlyRevenue)}
                </div>
                <div className="flex items-center text-xs text-chart-3 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+8% from last month</span>
                </div>
              </div>
              
              {/* Pending Payments */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-chart-4" />
                    <span className="text-sm font-medium text-foreground/70">Pending</span>
                  </div>
                  <Badge className="bg-chart-4/20 text-chart-4">
                    {pendingPercentage}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatCurrency(pendingPayments)}
                </div>
                <div className="flex items-center text-xs text-destructive mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>+3% from last month</span>
                </div>
              </div>
              
              {/* Active Subscriptions */}
              <div className="p-4 rounded-lg border bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-chart-2" />
                    <span className="text-sm font-medium text-foreground/70">Subscriptions</span>
                  </div>
                  <Badge className="bg-chart-2/20 text-chart-2">
                    Active
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground/90">
                  {formatNumber(activeSubscriptions)}
                </div>
                <div className="flex items-center text-xs text-chart-3 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+15 from last month</span>
                </div>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Monthly Revenue Target</span>
                  <span>84%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-chart-1 h-2 rounded-full"
                    style={{ width: `84%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Pending Payments</span>
                  <span>{pendingPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-chart-4 h-2 rounded-full"
                    style={{ width: `${pendingPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-foreground/50 mb-1">
                  <span>Subscription Renewal Rate</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-chart-3 h-2 rounded-full"
                    style={{ width: `92%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="text-xs text-foreground/50 text-center pt-2">
              Financial data updated daily. Last updated: Today at 8:00 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}