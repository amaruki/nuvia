"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Mail,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Plus,
  Gift,
  Target,
  HandHeart,
} from "lucide-react";

import { DonationsOverviewCards } from "@/components/finance/donations-overview-cards";
import { DonationsTable } from "@/components/finance/donations-table";
import { DonationsFilters } from "@/components/finance/donations-filters";
import { DonationDetailsModal } from "@/components/finance/donation-details-modal";
import { AddDonationForm } from "@/components/finance/add-donation-form";
import { useDonations } from "@/lib/hooks/use-donations";
import { useHeader } from "@/contexts/dashboard-context";
import { Donation } from "@/types/finance.types";

export default function FinanceDonations() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showAddDonation, setShowAddDonation] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    donations,
    campaigns,
    payments,
    statistics,
    loading,
    error,
    filters,
    updateDonationStatus,
    recordPayment,
    sendReceipt,
    refreshData,
    updateFilters,
    clearFilters,
    addDonation,
  } = useDonations();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    setHeader({
      title: "Donations & Fundraising",
      description: "Manage donations, campaigns, and fundraising activities",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (donation: Donation) => {
    setSelectedDonation(donation);
  };

  const handleAddDonation = (data: any) => {
    addDonation(data);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <DonationsOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {donations.length} donations total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.donorCount} donors
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setShowAddDonation(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Donation</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <DonationsFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="donations" className="text-xs sm:text-sm py-2 px-2">
            All Donations
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs sm:text-sm py-2 px-2">
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Recent Donations</CardTitle>
                <CardDescription className="text-sm">Latest donation contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-sm font-medium truncate">{donation.donorName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {donation.donorType} • {donation.donationType.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{formatCurrency(donation.amount)}</p>
                        <Badge
                          variant={
                            donation.status === "completed"
                              ? "default"
                              : donation.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {donation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Top Campaigns</CardTitle>
                <CardDescription className="text-sm">
                  Best performing fundraising campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {campaign.category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {formatCurrency(campaign.raisedAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of {formatCurrency(campaign.goalAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donation Trend */}
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Donation Trend</CardTitle>
                <CardDescription className="text-sm">Monthly donation performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm font-medium truncate">{month.month}</span>
                        <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{formatCurrency(month.amount)}</p>
                        <p className="text-xs text-muted-foreground">{month.count} donations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="donations" className="space-y-6">
          <DonationsTable
            donations={donations}
            payments={payments}
            onViewDetails={handleViewDetails}
            onRecordPayment={recordPayment}
            onSendReceipt={sendReceipt}
            onUpdateStatus={updateDonationStatus}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg truncate">{campaign.name}</CardTitle>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>
                          {Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Raised</span>
                      <span className="font-medium">{formatCurrency(campaign.raisedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Goal</span>
                      <span className="font-medium">{formatCurrency(campaign.goalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-medium">
                        {campaign.endDate
                          ? new Date(campaign.endDate).toLocaleDateString()
                          : "Ongoing"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Donor Type Breakdown */}
            {statistics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Donor Types</CardTitle>
                  <CardDescription className="text-sm">Donations by donor type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.donorTypeBreakdown.map((donorType, index) => (
                      <div key={donorType.donorType} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="text-sm font-medium capitalize truncate">
                            {donorType.donorType}
                          </p>
                          <p className="text-xs text-muted-foreground">{donorType.count} donors</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">{formatCurrency(donorType.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((donorType.amount / statistics.totalAmount) * 100)}% of
                            total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campaign Performance */}
            {statistics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Campaign Performance</CardTitle>
                  <CardDescription className="text-sm">Revenue by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.campaignBreakdown
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 5)
                      .map((campaign, index) => (
                        <div
                          key={campaign.campaignId}
                          className="flex items-center justify-between"
                        >
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-sm font-medium truncate">{campaign.campaignName}</p>
                            <p className="text-xs text-muted-foreground">
                              {campaign.count} donations
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium">{formatCurrency(campaign.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((campaign.amount / statistics.totalAmount) * 100)}% of
                              total
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DonationDetailsModal
        donation={selectedDonation}
        payments={payments}
        open={!!selectedDonation}
        onOpenChange={(open) => !open && setSelectedDonation(null)}
        onRecordPayment={recordPayment}
        onSendReceipt={sendReceipt}
        onUpdateStatus={updateDonationStatus}
      />

      <AddDonationForm
        open={showAddDonation}
        onOpenChange={setShowAddDonation}
        onSubmit={handleAddDonation}
        campaigns={campaigns}
      />
    </div>
  );
}
