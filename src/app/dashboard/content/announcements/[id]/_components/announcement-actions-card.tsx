import { Archive, Download, Megaphone, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleStatus } from "@/types/article";

interface AnnouncementActionsCardProps {
  status: ArticleStatus;
  onPublish: () => void;
  onArchive: () => void;
}

export function AnnouncementActionsCard({
  status,
  onPublish,
  onArchive,
}: AnnouncementActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "draft" && (
          <Button onClick={onPublish} className="w-full">
            <Megaphone className="mr-2 h-4 w-4" />
            Publish Announcement
          </Button>
        )}

        {status === "published" && (
          <Button onClick={onArchive} variant="outline" className="w-full">
            <Archive className="mr-2 h-4 w-4" />
            Archive Announcement
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
