"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import type { MediaSectionProps } from "./types";

export default function MediaSection({
  featuredImage,
  setFeaturedImage,
  gallery,
  setGallery,
  handleImageUpload,
  handleGalleryUpload,
}: MediaSectionProps) {
  return (
    <TabsContent value="media" className="mt-0 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Label>Featured Image</Label>
          {featuredImage ? (
            <div className="relative group">
              <img
                src={featuredImage}
                alt="Featured"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setFeaturedImage("")}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center bg-muted/30">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="f-upload"
              />
              <Label htmlFor="f-upload" className="cursor-pointer">
                <Button type="button" variant="secondary" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" /> Upload Image
                  </span>
                </Button>
              </Label>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label>Gallery Images</Label>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {gallery.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => setGallery((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
                id="g-upload"
              />
              <Label htmlFor="g-upload" className="cursor-pointer">
                <Button type="button" variant="secondary" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" /> Add Gallery Images
                  </span>
                </Button>
              </Label>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
}
