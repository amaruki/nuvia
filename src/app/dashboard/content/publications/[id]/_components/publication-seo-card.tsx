import { Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Publication } from "@/types/publication";

interface PublicationSeoCardProps {
  publication: Publication;
}

export function PublicationSeoCard({ publication }: PublicationSeoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          SEO & Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2">SEO Title</h4>
            <p className="text-sm text-muted-foreground">{publication.seo.title}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Meta Description</h4>
            <p className="text-sm text-muted-foreground">{publication.seo.description}</p>
          </div>
        </div>

        {publication.seo.keywords && publication.seo.keywords.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {publication.seo.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm font-medium">Visibility</span>
            <Badge variant="outline">{publication.visibility.replace("_", " ")}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm font-medium">Priority</span>
            <span className="font-medium">{publication.priority}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${publication.commentsEnabled ? "bg-green-500" : "bg-gray-300"}`}
            />
            <span className="text-sm">
              Comments {publication.commentsEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${publication.sharingEnabled ? "bg-green-500" : "bg-gray-300"}`}
            />
            <span className="text-sm">
              Sharing {publication.sharingEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${publication.downloadEnabled ? "bg-green-500" : "bg-gray-300"}`}
            />
            <span className="text-sm">
              Downloads {publication.downloadEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
