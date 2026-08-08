"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { MediaEditFormData } from "./edit-media-helpers";

interface BasicInfoCardProps {
  formData: MediaEditFormData;
  onInputChange: (field: string, value: unknown) => void;
}

/** Title, description, alt text and visibility fields for the media item. */
export function BasicInfoCard({ formData, onInputChange }: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange("title", e.target.value)}
            placeholder="Enter media title"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            placeholder="Enter media description"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="altText">Alt Text</Label>
          <Textarea
            id="altText"
            value={formData.altText}
            onChange={(e) => onInputChange("altText", e.target.value)}
            placeholder="Enter alt text for accessibility"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value) => onInputChange("visibility", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
