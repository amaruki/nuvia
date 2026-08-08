"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { PublicationFormData } from "@/types/publication";
import { usePublications } from "@/lib/hooks/use-publications";
import { publicationFormSchema } from "./schema";
import { PublicationPageFormProps } from "./types";
import { BasicInfoTab } from "./basic-info-tab";
import { ContentTab } from "./content-tab";
import { SeoTab } from "./seo-tab";
import { SettingsTab } from "./settings-tab";

export default function PublicationPageForm({
  onSubmit,
  initialData,
  isEditing = false,
}: PublicationPageFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  // Author choices come from the real publications (backlog F2): the
  // content API stores authors on each item, so existing authors are the
  // honest source. This hook instance shares the content query cache with
  // the page's own usePublications call.
  const { filteredPublications } = usePublications();
  const authors = Array.from(
    new Map(
      filteredPublications.map((publication) => [publication.author.id, publication.author]),
    ).values(),
  );

  const form = useForm<z.input<typeof publicationFormSchema>, unknown, PublicationFormData>({
    resolver: zodResolver(publicationFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      type: "article",
      category: "technology",
      status: "draft",
      authorId: "",
      coAuthorIds: [],
      tagIds: [],
      difficulty: "beginner",
      visibility: "public",
      commentsEnabled: true,
      sharingEnabled: true,
      downloadEnabled: true,
      isFeatured: false,
      isPinned: false,
      priority: 5,
      seo: {
        title: "",
        description: "",
        keywords: [],
        ogImage: "",
      },
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      if (initialData.featuredImage) setFeaturedImage(initialData.featuredImage);
      if (initialData.gallery) setGallery(initialData.gallery);
    }
  }, [initialData, form]);

  const handleSubmit = (data: PublicationFormData) => {
    const formDataWithMedia: PublicationFormData = {
      ...data,
      featuredImage,
      gallery,
      attachments,
    };
    onSubmit(formDataWithMedia);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFeaturedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setGallery((prev) => [...prev, e.target?.result as string]);
        reader.readAsDataURL(file);
      }
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const watchTitle = form.watch("title");
  const watchContent = form.watch("content");

  return (
    <div className="container max-w-5xl py-6 mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 text-muted-foreground hover:text-primary"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Publications
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Edit Publication" : "Create New Publication"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update the details and metadata for your existing publication."
              : "Fill in the information below to create a new publication."}
          </p>
        </div>

        {/* Top Actions (Optional for desktop convenience) */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : isEditing ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="min-h-[500px] border rounded-xl p-6 bg-card">
            <BasicInfoTab
              form={form}
              authors={authors}
              watchTitle={watchTitle}
              generateSlug={generateSlug}
            />
            <ContentTab
              form={form}
              watchContent={watchContent}
              featuredImage={featuredImage}
              setFeaturedImage={setFeaturedImage}
              handleImageUpload={handleImageUpload}
            />
            <SeoTab form={form} />
            <SettingsTab form={form} />
          </div>
        </Tabs>

        {/* Bottom Sticky Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Discard Changes
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="min-w-[150px]"
          >
            {form.formState.isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Publication"}
          </Button>
        </div>
      </form>
    </div>
  );
}
