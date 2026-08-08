import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Eye, FileText } from "lucide-react";
import type { MediaUsage } from "@/types/media";

interface UsageTabProps {
  usageItems: MediaUsage[];
}

export default function UsageTab({ usageItems }: UsageTabProps) {
  return (
    <TabsContent value="usage" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Media Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {usageItems.length > 0 ? (
            <div className="space-y-4">
              {usageItems.map((usage) => (
                <div key={usage.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{usage.entityTitle}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">{usage.usageType}</Badge>
                        <span className="text-xs text-gray-500">Added by {usage.addedBy}</span>
                        <span className="text-xs text-gray-500">
                          {usage.addedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No usage found</p>
              <p className="text-sm text-gray-600">
                This media file is not currently used anywhere
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
