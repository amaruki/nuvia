import { Pin, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Announcement } from "@/types/announcement";

import { AnnouncementPriorityBadge, AnnouncementStatusBadge } from "./announcement-badges";

interface AnnouncementContentCardProps {
  announcement: Announcement;
}

export function AnnouncementContentCard({ announcement }: AnnouncementContentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{announcement.title}</CardTitle>
          <div className="flex items-center gap-2">
            <AnnouncementStatusBadge status={announcement.status} />
            <AnnouncementPriorityBadge priority={announcement.priority} />
            {announcement.isPinned && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
            {announcement.isUrgent && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Urgent
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{announcement.excerpt}</p>
        {/*
         * Rendered as escaped plain text, never as HTML (security issue #1).
         * This matches every other announcement surface - the public news page,
         * the member inbox and the moderation widget all render `content` as
         * text - and the authoring editor is a plain textarea, so no legitimate
         * HTML exists. `dangerouslySetInnerHTML` here previously allowed a
         * stored-XSS privilege-escalation vector.
         */}
        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
          {announcement.content}
        </p>
      </CardContent>
    </Card>
  );
}

interface AnnouncementFeaturedImageCardProps {
  image: string;
  alt: string;
}

export function AnnouncementFeaturedImageCard({ image, alt }: AnnouncementFeaturedImageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Image</CardTitle>
      </CardHeader>
      <CardContent>
        <img src={image} alt={alt} className="w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
