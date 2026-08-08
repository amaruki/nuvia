import { TabsContent } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";

export function CategoriesAnalyticsTab() {
  return (
    <TabsContent value="analytics" className="space-y-6">
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Category analytics will appear here</p>
        <p className="text-sm mt-2">Detailed usage statistics and trends coming soon</p>
      </div>
    </TabsContent>
  );
}
