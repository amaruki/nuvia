"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Committee,
  CommitteeLeadership,
  CommitteeMember,
  CommitteeMeeting,
} from "@/types/committee.types";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Target,
  Award,
  Clock,
  CheckSquare,
  Briefcase,
  ExternalLink,
  UserPlus,
  Edit,
  Settings,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { mockCommittees } from "@/lib/data/mock-committee-data";

export default function CommitteeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { setHeader, clearHeader } = useHeader();

  const committeeId = params.id as string;

  useEffect(() => {
    // Set header title when committee is loaded
    if (committee) {
      setHeader({
        title: committee.displayName,
        description: committee.description || "Committee details and management",
      });
    }

    return () => {
      clearHeader();
    };
  }, [committee, setHeader, clearHeader]);

  useEffect(() => {
    // Simulate API call to fetch committee details
    const fetchCommittee = async () => {
      setLoading(true);
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const foundCommittee = mockCommittees.find((c) => c.id === committeeId);
        setCommittee(foundCommittee || null);
      } catch (error) {
        console.error("Error fetching committee:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommittee();
  }, [committeeId]);

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

  const getTypeBadge = (type: string) => {
    const colors = {
      executive: "bg-purple-100 text-purple-800 border-purple-200",
      functional: "bg-blue-100 text-blue-800 border-blue-200",
      special_interest: "bg-green-100 text-green-800 border-green-200",
      ad_hoc: "bg-orange-100 text-orange-800 border-orange-200",
      standing: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };

    return (
      <Badge
        variant="outline"
        className={
          colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {type.replace("_", " ").charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}
      </Badge>
    );
  };

  const getAuthorityBadge = (authority: string) => {
    const variants = {
      executive: "default" as const,
      strategic: "secondary" as const,
      operational: "outline" as const,
      advisory: "destructive" as const,
    };

    return (
      <Badge variant={variants[authority as keyof typeof variants] || "secondary"}>
        {authority.charAt(0).toUpperCase() + authority.slice(1)}
      </Badge>
    );
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mb-2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Committee Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The committee you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Committees
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Committee
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{committee.metrics.memberCount}</div>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <div className="text-2xl font-bold">{committee.metrics.activeMembersCount}</div>
            <p className="text-sm text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {formatPercentage(committee.metrics.meetingAttendanceRate)}
            </div>
            <p className="text-sm text-muted-foreground">Meeting Attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">
              {formatPercentage(committee.metrics.goalCompletionRate)}
            </div>
            <p className="text-sm text-muted-foreground">Goal Completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="charter">Charter</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(committee.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  {getTypeBadge(committee.type)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authority Level</span>
                  {getAuthorityBadge(committee.charter.authorityLevel)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(committee.createdAt, { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(committee.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Impact Score</span>
                  </div>
                  <span className="font-semibold">{committee.metrics.impactScore.toFixed(1)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium">Satisfaction Score</span>
                  </div>
                  <span className="font-semibold">
                    {formatPercentage(committee.metrics.satisfactionScore)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Deliverables</span>
                  </div>
                  <span className="font-semibold">{committee.metrics.deliverablesCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purpose and Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purpose & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Purpose</h4>
                <p className="text-sm text-muted-foreground">{committee.purpose}</p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Contact Information</h4>
                  <div className="space-y-2">
                    {committee.contactInfo.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${committee.contactInfo.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {committee.contactInfo.email}
                        </a>
                      </div>
                    )}

                    {committee.contactInfo.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${committee.contactInfo.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {committee.contactInfo.phone}
                        </a>
                      </div>
                    )}

                    {committee.contactInfo.meetingLocation && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{committee.contactInfo.meetingLocation}</span>
                      </div>
                    )}

                    {committee.contactInfo.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={committee.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leadership" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Committee Leadership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {committee.leadership.map((leader) => (
                  <LeadershipCard key={leader.id} leader={leader} />
                ))}
                {committee.leadership.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No leadership assigned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Committee Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {committee.members.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
                {committee.members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No members assigned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Committee Charter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Mission Statement</h4>
                <p className="text-sm text-muted-foreground">
                  {committee.charter.missionStatement}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Responsibilities</h4>
                <ul className="space-y-1">
                  {committee.charter.responsibilities.map((responsibility, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      {responsibility}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Decision Making Process</h4>
                  <p className="text-sm text-muted-foreground">
                    {committee.charter.decisionMakingProcess}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Reporting Structure</h4>
                  <p className="text-sm text-muted-foreground">
                    {committee.charter.reportingStructure}
                  </p>
                </div>
              </div>

              {committee.charter.termLimits && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Term Limits</h4>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Chair Term:</span>
                      <span className="ml-2 font-medium">
                        {committee.charter.termLimits.chairTerm} months
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Member Term:</span>
                      <span className="ml-2 font-medium">
                        {committee.charter.termLimits.memberTerm} months
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Terms:</span>
                      <span className="ml-2 font-medium">
                        {committee.charter.termLimits.maxTerms}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {committee.meetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
                {committee.meetings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No meetings scheduled yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeadershipCard({ leader }: { leader: CommitteeLeadership }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
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
          <p className="text-xs text-muted-foreground">
            Since {formatDistanceToNow(leader.startDate, { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={leader.isActive ? "default" : "secondary"}>
          {leader.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: CommitteeMember }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-muted-foreground">
            Joined {formatDistanceToNow(member.joinDate, { addSuffix: true })}
          </p>
          {member.expertise && member.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {member.expertise.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <Badge variant={member.isActive ? "default" : "secondary"}>
            {member.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {member.contributionLevel}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: CommitteeMeeting }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{meeting.title}</h4>
        <Badge variant={meeting.isVirtual ? "outline" : "default"}>
          {meeting.isVirtual ? "Virtual" : "In-Person"}
        </Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{meeting.date.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{meeting.duration} minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{meeting.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{meeting.attendanceCount} attendees</span>
        </div>
      </div>
      {meeting.agenda && meeting.agenda.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium mb-1">Agenda</h5>
          <ul className="space-y-1">
            {meeting.agenda.slice(0, 3).map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {item}
              </li>
            ))}
            {meeting.agenda.length > 3 && (
              <li className="text-sm text-muted-foreground">
                +{meeting.agenda.length - 3} more items
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
