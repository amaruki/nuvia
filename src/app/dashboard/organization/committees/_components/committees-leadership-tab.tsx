import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Committee } from "@/types/committee";

interface CommitteesLeadershipTabProps {
  committees: Committee[];
}

export function CommitteesLeadershipTab({ committees }: CommitteesLeadershipTabProps) {
  return (
    <TabsContent value="leadership" className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Committee Leadership Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {committees.map((committee) => (
            <div key={committee.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{committee.displayName}</h4>
                <Badge variant="outline">{committee.leadership.length} leaders</Badge>
              </div>
              <div className="space-y-2">
                {committee.leadership.slice(0, 3).map((leader) => (
                  <div key={leader.id} className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{leader.name}</p>
                      <p className="text-muted-foreground truncate">{leader.title}</p>
                    </div>
                  </div>
                ))}
                {committee.leadership.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{committee.leadership.length - 3} more leaders
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TabsContent>
  );
}
