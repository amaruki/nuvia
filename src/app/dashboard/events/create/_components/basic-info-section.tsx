"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EventType } from "@/types/event";
import type { ApiEventCategory } from "@/lib/services/event/types";

import type { CreateEventFormData, FormInputChangeHandler } from "./create-event-types";

const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

interface BasicInfoSectionProps {
  formData: CreateEventFormData;
  onInputChange: FormInputChangeHandler;
  onSelectChange: (name: string, value: string) => void;
  errors?: Record<string, string>;
  categories: ApiEventCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  onAddCategory: () => void;
  isAddingCategory: boolean;
}

/** Title, descriptions, category and event type fields. */
export function BasicInfoSection({
  formData,
  onInputChange,
  onSelectChange,
  errors,
  categories,
  categoriesLoading,
  categoriesError,
  newCategoryName,
  onNewCategoryNameChange,
  onAddCategory,
  isAddingCategory,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground/90">Basic Information</h3>

      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          required
          className="mt-1"
        />
        {errors?.title && <p className="mt-1 text-sm text-destructive">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          value={formData.shortDescription}
          onChange={onInputChange}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          rows={5}
          className="mt-1"
        />
        {errors?.description && (
          <p className="mt-1 text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        {categoriesLoading ? (
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading categories…
          </div>
        ) : categoriesError ? (
          <p className="mt-1 text-sm text-destructive">{categoriesError}</p>
        ) : categories.length === 0 ? (
          <div className="mt-1 space-y-2 rounded-md border border-dashed p-3">
            <p className="text-sm text-muted-foreground">
              No event categories exist yet. A category is required to create an event — add the
              first one below.
            </p>
            <div className="flex gap-2">
              <Input
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => onNewCategoryNameChange(e.target.value)}
                placeholder="Category name, e.g. General"
                aria-label="New category name"
              />
              <Button
                type="button"
                variant="outline"
                onClick={onAddCategory}
                disabled={isAddingCategory || !newCategoryName.trim()}
              >
                {isAddingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add category
              </Button>
            </div>
          </div>
        ) : (
          <Select
            value={formData.category}
            onValueChange={(value) => onSelectChange("category", value)}
          >
            <SelectTrigger id="category" className="mt-1 w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.displayName ?? category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors?.category && <p className="mt-1 text-sm text-destructive">{errors.category}</p>}
      </div>

      <div>
        <Label htmlFor="eventType">Event Type</Label>
        <Select
          value={formData.eventType}
          onValueChange={(value) => onSelectChange("eventType", value)}
        >
          <SelectTrigger id="eventType" className="mt-1 w-full">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
