"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  Eye,
  Trash2,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Archive,
} from "lucide-react";

import { useMedia } from "@/lib/hooks/use-media";
import { Media, MediaType, MediaVisibility, MediaTag } from "@/types/media";

export default function EditMediaPage() {
  const params = useParams();
  const router = useRouter();
  const mediaId = params.id as string;

  const { media, updateMedia, deleteMedia, loading } = useMedia();
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    altText: "",
    visibility: "private" as MediaVisibility,
    tags: [] as string[],
    folderId: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const mediaItem = media.find((m) => m.id === mediaId);
    if (mediaItem) {
      setCurrentMedia(mediaItem);
      setFormData({
        title: mediaItem.title,
        description: mediaItem.description || "",
        altText: mediaItem.altText || "",
        visibility: mediaItem.visibility,
        tags: mediaItem.tags.map((tag) => tag.name),
        folderId: mediaItem.folderId || "",
      });
    }
  }, [mediaId, media]);

  const getMediaIcon = (type: MediaType) => {
    const iconMap = {
      image: ImageIcon,
      video: Video,
      audio: Music,
      document: FileText,
      archive: Archive,
      spreadsheet: FileText,
      presentation: FileText,
      pdf: FileText,
      vector: ImageIcon,
      font: FileText,
    };
    return iconMap[type] || FileText;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const idx = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSave = async () => {
    if (!currentMedia) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateMedia(mediaId, {
        title: formData.title,
        description: formData.description,
        altText: formData.altText,
        visibility: formData.visibility,
        tags: formData.tags,
        folderId: formData.folderId || undefined,
      });

      router.push("/dashboard/content/media");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update media");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentMedia) return;

    if (
      confirm(
        `Are you sure you want to delete "${currentMedia.title}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteMedia(mediaId);
        router.push("/dashboard/content/media");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete media");
      }
    }
  };

  const handlePreview = () => {
    if (currentMedia) {
      window.open(currentMedia.url, "_blank");
    }
  };

  if (!currentMedia) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const Icon = getMediaIcon(currentMedia.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/content/media")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Media Library
          </Button>

          <div className="flex items-center gap-2">
            <div className="text-blue-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Edit Media</h1>
              <p className="text-sm text-gray-600">{currentMedia.metadata.fileName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
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
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter media title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter media description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Textarea
                  id="altText"
                  value={formData.altText}
                  onChange={(e) => handleInputChange("altText", e.target.value)}
                  placeholder="Enter alt text for accessibility"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => handleInputChange("visibility", value)}
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

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} disabled={!tagInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Media Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Media Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentMedia.thumbnailUrl ? (
                  <img
                    src={currentMedia.thumbnailUrl}
                    alt={currentMedia.title}
                    className="w-full rounded-lg border"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <Icon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{currentMedia.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">
                      {formatFileSize(currentMedia.metadata.size)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {currentMedia.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSave} disabled={isSaving || loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>

              <Button variant="outline" onClick={handlePreview} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Preview Media
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open(currentMedia.url, "_blank")}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Download Original
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
