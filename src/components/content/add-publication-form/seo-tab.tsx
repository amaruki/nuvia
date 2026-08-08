import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { PublicationForm } from "./types";

interface SeoTabProps {
  form: PublicationForm;
}

export function SeoTab({ form }: SeoTabProps) {
  return (
    <TabsContent value="seo" className="mt-0 space-y-6">
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="seo.title">SEO Title</Label>
          <Input {...form.register("seo.title")} placeholder="Search engine title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo.description">Meta Description</Label>
          <Textarea
            {...form.register("seo.description")}
            rows={4}
            placeholder="Description for search results..."
          />
        </div>
      </div>
    </TabsContent>
  );
}
