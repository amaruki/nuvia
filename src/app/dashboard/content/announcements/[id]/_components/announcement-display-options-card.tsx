import { Home, Layout, Mail, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Announcement } from "@/types/announcement";

interface AnnouncementDisplayOptionsCardProps {
  announcement: Announcement;
}

export function AnnouncementDisplayOptionsCard({
  announcement,
}: AnnouncementDisplayOptionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Homepage:</span>
          <Badge variant={announcement.displayOnHomepage ? "default" : "secondary"}>
            {announcement.displayOnHomepage ? "Yes" : "No"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Dashboard:</span>
          <Badge variant={announcement.displayInDashboard ? "default" : "secondary"}>
            {announcement.displayInDashboard ? "Yes" : "No"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Email:</span>
          <Badge variant={announcement.sendEmailNotification ? "default" : "secondary"}>
            {announcement.sendEmailNotification ? "Yes" : "No"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Push:</span>
          <Badge variant={announcement.sendPushNotification ? "default" : "secondary"}>
            {announcement.sendPushNotification ? "Yes" : "No"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
