import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

export default function ActivityTab() {
  return (
    <TabsContent value="activity" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="size-12 mx-auto mb-4 opacity-50" />
            <p>Activity log coming soon</p>
            <p className="text-sm">This section will show recent user actions and login history.</p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
