"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import type { ArticleFormSectionProps } from "./types";

export default function SeoSection({ form }: ArticleFormSectionProps) {
  return (
    <TabsContent value="seo" className="mt-0 space-y-6">
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="seo.title">SEO Title</Label>
          <Input {...form.register("seo.title")} placeholder="Search engine title" />
          {form.formState.errors.seo && "title" in form.formState.errors.seo && (
            <p className="text-sm text-destructive">{form.formState.errors.seo.title?.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo.description">Meta Description</Label>
          <Textarea
            {...form.register("seo.description")}
            rows={4}
            placeholder="Description for search results..."
          />
          {form.formState.errors.seo && "description" in form.formState.errors.seo && (
            <p className="text-sm text-destructive">
              {form.formState.errors.seo.description?.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo.ogImage">OG Image URL</Label>
          <Input {...form.register("seo.ogImage")} placeholder="https://example.com/image.jpg" />
        </div>
      </div>
    </TabsContent>
  );
}
