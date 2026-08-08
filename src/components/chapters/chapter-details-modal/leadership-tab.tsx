import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Chapter } from "@/types/chapter.types";

interface LeadershipTabProps {
  chapter: Chapter;
}

export default function LeadershipTab({ chapter }: LeadershipTabProps) {
  return (
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
  );
}
