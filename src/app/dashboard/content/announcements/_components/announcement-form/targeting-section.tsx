"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_PRIORITY_DISPLAY,
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY,
} from "@/types/announcement";

import { AUDIENCE_ICON_MAP, PRIORITY_ICON_MAP } from "./icon-maps";
import type { AnnouncementFormSectionProps } from "./types";

/**
 * Targeting controls. Priority and audience keep rich option labels
 * (icon + name) via direct FormField composition; expiration is a
 * calendar popover because it carries a Date value, which the native
 * DateField shorthand (YYYY-MM-DD strings) cannot model.
 */
export function TargetingSection({ form }: AnnouncementFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ANNOUNCEMENT_PRIORITIES.map((priority) => {
                    const IconComponent = PRIORITY_ICON_MAP[priority];
                    return (
                      <SelectItem key={priority} value={priority}>
                        <div className="flex items-center gap-2">
                          {IconComponent ? <IconComponent className="h-4 w-4" /> : null}
                          <span>{ANNOUNCEMENT_PRIORITY_DISPLAY[priority].name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target audience</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ANNOUNCEMENT_TARGET_AUDIENCES.map((audience) => {
                    const IconComponent = AUDIENCE_ICON_MAP[audience];
                    return (
                      <SelectItem key={audience} value={audience}>
                        <div className="flex items-center gap-2">
                          {IconComponent ? <IconComponent className="h-4 w-4" /> : null}
                          <span>{ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[audience].name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="expiresAt"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Expiration date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal md:w-1/2",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : "Pick a date"}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
