import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TYPE_DISPLAY,
  ANNOUNCEMENT_PRIORITY_DISPLAY,
  ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY,
  type AnnouncementPriority,
  type AnnouncementTargetAudience,
  type AnnouncementType,
} from "@/types/announcement";

import { AUDIENCE_ICON_MAP, PRIORITY_ICON_MAP, TYPE_ICON_MAP } from "./icon-maps";
import type { AnnouncementForm, AnnouncementFormFields } from "./types";

interface ContentTabProps {
  form: AnnouncementForm;
  formValues: AnnouncementFormFields;
}

export function ContentTab({ form, formValues }: ContentTabProps) {
  const selectedType = formValues.type;
  const selectedPriority = formValues.priority;
  const selectedAudience = formValues.targetAudience;

  return (
    <TabsContent value="content" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" placeholder="Enter announcement title" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => form.setValue("type", value as AnnouncementType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select announcement type" />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_TYPES.map((type) => {
                const IconComponent = TYPE_ICON_MAP[type as keyof typeof TYPE_ICON_MAP];

                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span>{ANNOUNCEMENT_TYPE_DISPLAY[type].name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt *</Label>
        <Textarea
          id="excerpt"
          placeholder="Brief summary of the announcement"
          rows={3}
          {...form.register("excerpt")}
        />
        {form.formState.errors.excerpt && (
          <p className="text-sm text-red-500">{form.formState.errors.excerpt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          placeholder="Full announcement content"
          rows={8}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={selectedPriority}
            onValueChange={(value) => form.setValue("priority", value as AnnouncementPriority)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_PRIORITIES.map((priority) => {
                const PriorityIconComponent =
                  PRIORITY_ICON_MAP[priority as keyof typeof PRIORITY_ICON_MAP];

                return (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex items-center gap-2">
                      {PriorityIconComponent && <PriorityIconComponent className="h-4 w-4" />}
                      <span>{ANNOUNCEMENT_PRIORITY_DISPLAY[priority].name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Select
            value={selectedAudience}
            onValueChange={(value) =>
              form.setValue("targetAudience", value as AnnouncementTargetAudience)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_TARGET_AUDIENCES.map((audience) => {
                const AudienceIconComponent =
                  AUDIENCE_ICON_MAP[audience as keyof typeof AUDIENCE_ICON_MAP];

                return (
                  <SelectItem key={audience} value={audience}>
                    <div className="flex items-center gap-2">
                      {AudienceIconComponent && <AudienceIconComponent className="h-4 w-4" />}
                      <span>{ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[audience].name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Expiration Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formValues.expiresAt && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formValues.expiresAt ? format(formValues.expiresAt, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={formValues.expiresAt}
                onSelect={(date) => form.setValue("expiresAt", date)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TabsContent>
  );
}
