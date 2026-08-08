"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ContentSectionProps } from "./types";

export default function ContentSection({ form, watchContent }: ContentSectionProps) {
  return (
    <TabsContent value="content" className="mt-0 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="content">Full Content *</Label>
        <Textarea
          id="content"
          {...form.register("content")}
          placeholder="Start writing your article..."
          rows={20}
          className={cn("font-mono", form.formState.errors.content && "border-destructive")}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{watchContent?.length || 0} characters</span>
          <span>{Math.ceil((watchContent?.length || 0) / 200)} min read</span>
        </div>
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">
            {form.formState.errors.content.message as string}
          </p>
        )}
      </div>
    </TabsContent>
  );
}
