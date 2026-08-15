"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import type { ContentSectionProps } from "./types";

/**
 * Publication body: a plain monospace textarea (the legacy widget) with a
 * character / reading-time footer, composed directly on FormField.
 */
export function ContentSection({ form, watchContent }: ContentSectionProps) {
  return (
    <div className="space-y-2">
      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Full content<span aria-hidden="true"> *</span>
            </FormLabel>
            <FormControl>
              <Textarea rows={15} placeholder="Start writing..." className="font-mono" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{watchContent?.length || 0} characters</span>
        <span>{Math.ceil((watchContent?.length || 0) / 200)} min read</span>
      </div>
    </div>
  );
}
