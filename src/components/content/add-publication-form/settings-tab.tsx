import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { PublicationFormData } from "@/types/publication";
import { visibilityOptions } from "./options";
import { PublicationForm } from "./types";

interface SettingsTabProps {
  form: PublicationForm;
}

export function SettingsTab({ form }: SettingsTabProps) {
  return (
    <TabsContent value="settings" className="mt-0 space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Access & Visibility</h3>
          <div className="space-y-4">
            <Select
              value={form.watch("visibility")}
              onValueChange={(value) =>
                form.setValue("visibility", value as PublicationFormData["visibility"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={form.watch("isFeatured")}
                onCheckedChange={(c) => form.setValue("isFeatured", !!c)}
              />
              <Label htmlFor="isFeatured">Feature this publication</Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Capabilities</h3>
          <div className="grid gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comments"
                checked={form.watch("commentsEnabled")}
                onCheckedChange={(c) => form.setValue("commentsEnabled", !!c)}
              />
              <Label htmlFor="comments">Enable comments</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sharing"
                checked={form.watch("sharingEnabled")}
                onCheckedChange={(c) => form.setValue("sharingEnabled", !!c)}
              />
              <Label htmlFor="sharing">Enable social sharing</Label>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
