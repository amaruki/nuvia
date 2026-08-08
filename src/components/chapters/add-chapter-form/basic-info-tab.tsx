import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { ChapterStatus } from "@/types/chapter.types";
import { statusOptions } from "./options";
import { ChapterForm } from "./types";

interface BasicInfoTabProps {
  form: ChapterForm;
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
  return (
    <TabsContent value="basic" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Chapter Name *</Label>
          <Input id="name" placeholder="e.g., new_york_chapter" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            placeholder="e.g., New York Chapter"
            {...form.register("displayName")}
          />
          {form.formState.errors.displayName && (
            <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the chapter's purpose and focus..."
          rows={3}
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value) => form.setValue("status", value as ChapterStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.status && (
          <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
        )}
      </div>
    </TabsContent>
  );
}
