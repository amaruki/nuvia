"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import type { ArticleFormData } from "@/types/article.types";
import { VISIBILITY_OPTIONS } from "./options";
import type { ArticleFormSectionProps } from "./types";

export default function SettingsSection({ form }: ArticleFormSectionProps) {
  return (
    <TabsContent value="settings" className="mt-0 space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Access & Visibility</h3>
          <div className="space-y-4">
            <Select
              value={form.watch("visibility")}
              onValueChange={(value) =>
                form.setValue("visibility", value as ArticleFormData["visibility"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((option) => (
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
              <Label htmlFor="isFeatured">Feature this article</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPinned"
                checked={form.watch("isPinned")}
                onCheckedChange={(c) => form.setValue("isPinned", !!c)}
              />
              <Label htmlFor="isPinned">Pin this article</Label>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="download"
                checked={form.watch("downloadEnabled")}
                onCheckedChange={(c) => form.setValue("downloadEnabled", !!c)}
              />
              <Label htmlFor="download">Enable downloads</Label>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
