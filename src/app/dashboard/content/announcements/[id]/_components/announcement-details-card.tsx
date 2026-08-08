import { formatDistanceToNow } from "date-fns";
import { Calendar, CheckCircle2, Clock, Eye, Megaphone, Star, Target, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Announcement } from "@/types/announcement";

function formatRelativeDate(date: Date | string | null | undefined) {
  if (!date) return "N/A";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

interface AnnouncementDetailsCardProps {
  announcement: Announcement;
}

export function AnnouncementDetailsCard({ announcement }: AnnouncementDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Announcement Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Published:</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatRelativeDate(announcement.publishedAt || null)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Target Audience:</span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {announcement.targetAudience?.replace("_", " ")}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Type:</span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {announcement.type?.replace("_", " ")}
          </p>
        </div>

        {announcement.expiresAt && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Expires:</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatRelativeDate(announcement.expiresAt)}
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Views:</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {announcement.metrics.views.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Engagement:</span>
          </div>
          <p className="text-sm text-muted-foreground">{announcement.metrics.engagementScore}%</p>
        </div>

        {(announcement.acknowledgmentCount || 0) > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Acknowledgments:</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {(announcement.acknowledgmentCount || 0).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
