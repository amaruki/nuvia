"use client";

import { Image as ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { MediaSectionProps } from "./types";

/**
 * Featured image widget carried over from the legacy form. It lives outside
 * react-hook-form (local sheet state merged into the payload on submit),
 * which is the standard escape hatch for file inputs.
 */
export function MediaSection({
  featuredImage,
  setFeaturedImage,
  handleImageUpload,
}: MediaSectionProps) {
  return (
    <div className="max-w-md space-y-4">
      <Label>Featured image</Label>
      {featuredImage ? (
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredImage}
            alt="Featured"
            className="h-48 w-full rounded-lg border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => setFeaturedImage("")}
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-10">
          <ImageIcon className="mb-4 h-10 w-10 text-muted-foreground" />
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="publication-featured-upload"
          />
          <Label htmlFor="publication-featured-upload" className="cursor-pointer">
            <Button type="button" variant="secondary" size="sm" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" /> Upload Image
              </span>
            </Button>
          </Label>
        </div>
      )}
    </div>
  );
}
