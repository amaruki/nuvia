"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Chapter } from "@/types/chapter.types";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Settings,
  UserPlus,
  UserMinus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  // lucide-react v1 dropped brand/logo icons — see TODO.md
  Users as Facebook,
  MessageCircle as Twitter,
  Link2 as Linkedin,
  Image as Instagram,
  Video as Youtube,
  Edit,
  Power,
  PowerOff,
} from "lucide-react";

interface ChapterDetailsModalProps {
  chapter: Chapter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}

export function ChapterDetailsModal({
  chapter,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
}: ChapterDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!chapter) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      inactive: "secondary" as const,
      pending: "outline" as const,
      suspended: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getFinancialHealthBadge = (health: string) => {
    const variants = {
      excellent: "default" as const,
      good: "secondary" as const,
      fair: "outline" as const,
      poor: "destructive" as const,
    };

    return (
      <Badge variant={variants[health as keyof typeof variants] || "secondary"}>
        {health.charAt(0).toUpperCase() + health.slice(1)}
      </Badge>
    );
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-rose-500" />
    );
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? "text-emerald-600" : "text-rose-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {chapter.displayName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(chapter)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onToggleStatus(chapter, chapter.status === "active" ? "inactive" : "active")
              }
            >
              {chapter.status === "active" ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(chapter.status)}
                      {getStatusBadge(chapter.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Established</span>
                    <span className="text-sm">
                      {formatDistanceToNow(chapter.establishedDate, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Financial Health</span>
                    {getFinancialHealthBadge(chapter.metrics.financialHealth)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Count</span>
                    <span className="text-sm font-bold">
                      {chapter.memberCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <div className="flex items-center gap-2">
                      {getGrowthIcon(chapter.metrics.memberGrowthRate)}
                      <span
                        className={`text-sm font-bold ${getGrowthColor(chapter.metrics.memberGrowthRate)}`}
                      >
                        {formatPercentage(chapter.metrics.memberGrowthRate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {chapter.location.address}
                        <br />
                        {chapter.location.city}, {chapter.location.state}{" "}
                        {chapter.location.postalCode}
                        <br />
                        {chapter.location.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Region</p>
                      <p className="text-sm text-muted-foreground">{chapter.location.region}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Timezone</p>
                      <p className="text-sm text-muted-foreground">{chapter.location.timezone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a
                        href={`mailto:${chapter.contactInfo.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {chapter.contactInfo.email}
                      </a>
                    </div>
                  </div>
                  {chapter.contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <a
                          href={`tel:${chapter.contactInfo.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {chapter.contactInfo.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {chapter.contactInfo.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Website</p>
                        <a
                          href={chapter.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {chapter.contactInfo.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            {Object.values(chapter.socialMedia).some((value) => value) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(chapter.socialMedia).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          {getSocialIcon(platform)}
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leadership" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chapter Leadership</CardTitle>
              </CardHeader>
              <CardContent>
                {chapter.leadership.length > 0 ? (
                  <div className="space-y-4">
                    {chapter.leadership.map((leader) => (
                      <div
                        key={leader.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={leader.avatar} alt={leader.name} />
                            <AvatarFallback>
                              {leader.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{leader.name}</p>
                            <p className="text-sm text-muted-foreground">{leader.title}</p>
                            <p className="text-xs text-muted-foreground">{leader.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="capitalize">
                            {leader.role.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Since {formatDistanceToNow(leader.startDate, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No leadership team members assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement Score</span>
                    <span className="text-sm font-bold">
                      {chapter.metrics.engagementScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Event Attendance Rate</span>
                    <span className="text-sm font-bold">
                      {formatPercentage(chapter.metrics.eventAttendanceRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Retention Rate</span>
                    <span className="text-sm font-bold">
                      {formatPercentage(chapter.metrics.retentionRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Members (This Month)</span>
                    <span className="text-sm font-bold">{chapter.metrics.newMembersThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Members (This Month)</span>
                    <span className="text-sm font-bold">
                      {chapter.metrics.activeMembersThisMonth}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chapter.metrics.monthlyTrend.map((trend, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{trend.month}</p>
                          <p className="text-sm text-muted-foreground">{trend.eventCount} events</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{trend.memberCount} members</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPercentage(trend.attendanceRate)} attendance
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chapter Events</CardTitle>
              </CardHeader>
              <CardContent>
                {chapter.events.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chapter.events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>{event.date.toLocaleDateString()}</TableCell>
                          <TableCell>{event.attendance}</TableCell>
                          <TableCell>{formatCurrency(event.revenue)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                event.status === "completed"
                                  ? "default"
                                  : event.status === "upcoming"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {event.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finances" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(chapter.finances.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Expenses</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(chapter.finances.totalExpenses)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Income</span>
                    <span
                      className={`text-sm font-bold ${chapter.finances.netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatCurrency(chapter.finances.netIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Budget</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(chapter.finances.budget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Budget Utilization</span>
                    <span className="text-sm font-bold">
                      {formatPercentage(chapter.finances.budgetUtilization)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chapter Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Membership Dues</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(chapter.settings.membershipDues)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Meeting Frequency</span>
                    <Badge variant="outline" className="capitalize">
                      {chapter.settings.meetingFrequency}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Online Registration</span>
                    <Badge
                      variant={chapter.settings.allowOnlineRegistration ? "default" : "secondary"}
                    >
                      {chapter.settings.allowOnlineRegistration ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Require Approval</span>
                    <Badge variant={chapter.settings.requireApproval ? "default" : "secondary"}>
                      {chapter.settings.requireApproval ? "Required" : "Not Required"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-Renew Membership</span>
                    <Badge variant={chapter.settings.autoRenewMembership ? "default" : "secondary"}>
                      {chapter.settings.autoRenewMembership ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
