import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { MapPin, Globe, Clock, Mail, Phone, ExternalLink } from "lucide-react";
import type { Chapter } from "@/types/chapter.types";
import {
  getStatusIcon,
  getStatusBadge,
  getFinancialHealthBadge,
  getGrowthIcon,
  getGrowthColor,
  formatPercentage,
  getSocialIcon,
} from "./chapter-helpers";

interface ChapterOverviewTabProps {
  chapter: Chapter;
}

export function ChapterOverviewTab({ chapter }: ChapterOverviewTabProps) {
  return (
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
              <span className="text-sm font-bold">{chapter.memberCount.toLocaleString()}</span>
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
                  {chapter.location.city}, {chapter.location.state} {chapter.location.postalCode}
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
  );
}
