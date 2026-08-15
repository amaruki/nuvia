"use client";

import { Image as ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { MediaSectionProps } from "./types";

/**
 * Featured image + gallery widgets carried over from the legacy form. They
 * live outside react-hook-form (local sheet state merged into the payload
 * on submit), which is the standard escape hatch for file inputs.
 */
export function MediaSection({
  featuredImage,
  setFeaturedImage,
  gallery,
  setGallery,
  handleImageUpload,
  handleGalleryUpload,
}: MediaSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
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
              id="article-featured-upload"
            />
            <Label htmlFor="article-featured-upload" className="cursor-pointer">
              <Button type="button" variant="secondary" size="sm" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" /> Upload Image
                </span>
              </Button>
            </Label>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label>Gallery images</Label>
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {gallery.map((image, index) => (
              <div key={image} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  className="h-24 w-full rounded border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setGallery((previous) => previous.filter((_, i) => i !== index))}
                  className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-6">
            <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
              id="article-gallery-upload"
            />
            <Label htmlFor="article-gallery-upload" className="cursor-pointer">
              <Button type="button" variant="secondary" size="sm" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" /> Add Gallery Images
                </span>
              </Button>
            </Label>
          </div>
        )}
      </div>
    </div>
  );
}
