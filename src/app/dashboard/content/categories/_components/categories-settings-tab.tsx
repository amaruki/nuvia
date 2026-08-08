import { TabsContent } from "@/components/ui/tabs";
import { Settings } from "lucide-react";

export function CategoriesSettingsTab() {
  return (
    <TabsContent value="settings" className="space-y-6">
      <div className="text-center py-8 text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Category management settings</p>
        <p className="text-sm mt-2">Global settings and configuration options</p>
      </div>
    </TabsContent>
  );
}
