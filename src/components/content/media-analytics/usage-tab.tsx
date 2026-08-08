import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { DownloadCloud, TrendingUp } from "lucide-react";
import type { UsageTabProps } from "./types";
import { formatNumber, getMediaIcon } from "./helpers";

export function UsageTab({ stats }: UsageTabProps) {
  return (
    <TabsContent value="usage" className="space-y-6">
      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DownloadCloud className="h-5 w-5" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentUploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getMediaIcon(upload.type)}
                  <div>
                    <p className="font-medium">{upload.title}</p>
                    <p className="text-sm text-gray-600">
                      {upload.uploadedBy} • {upload.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatNumber(upload.size)} bytes</p>
                  <Badge variant="outline" className="text-xs">
                    {upload.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topPerforming.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getMediaIcon(item.type)}
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-sm font-medium">{formatNumber(item.views)}</p>
                    <p className="text-xs text-gray-600">Views</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatNumber(item.downloads)}</p>
                    <p className="text-xs text-gray-600">Downloads</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.usage}</p>
                    <p className="text-xs text-gray-600">Usage</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
