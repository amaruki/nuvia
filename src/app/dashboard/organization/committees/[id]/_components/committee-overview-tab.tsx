import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { Award, ExternalLink, Mail, MapPin, Phone, Target, Users } from "lucide-react";
import type { Committee } from "@/types/committee";
import {
  formatPercentage,
  getAuthorityBadge,
  getStatusBadge,
  getTypeBadge,
} from "./committee-helpers";

interface CommitteeOverviewTabProps {
  committee: Committee;
}

export function CommitteeOverviewTab({ committee }: CommitteeOverviewTabProps) {
  return (
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
  );
}
