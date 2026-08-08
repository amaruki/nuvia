import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Chapter } from "@/types/chapter.types";

interface LeadershipTabProps {
  chapters: Chapter[];
}

export function LeadershipTab({ chapters }: LeadershipTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chapter Leadership Overview</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{chapter.displayName}</h4>
              <Badge variant="outline">{chapter.leadership.length} leaders</Badge>
            </div>
            <div className="space-y-2">
              {chapter.leadership.slice(0, 3).map((leader) => (
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
              {chapter.leadership.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{chapter.leadership.length - 3} more leaders
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
