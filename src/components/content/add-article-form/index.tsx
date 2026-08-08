"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import type { ArticlePageFormProps } from "./types";
import { useArticleForm } from "./use-article-form";
import BasicInfoSection from "./basic-info-section";
import ContentSection from "./content-section";
import SeoSection from "./seo-section";
import SettingsSection from "./settings-section";
import MediaSection from "./media-section";

export default function ArticlePageForm({
  onSubmit,
  initialData,
  isEditing = false,
}: ArticlePageFormProps) {
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    featuredImage,
    setFeaturedImage,
    gallery,
    setGallery,
    authors,
    form,
    handleSubmit,
    handleImageUpload,
    handleGalleryUpload,
    generateSlug,
    watchTitle,
    watchContent,
  } = useArticleForm(onSubmit, initialData);

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
            Back to Articles
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Edit Article" : "Create New Article"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update details and metadata for your existing article."
              : "Fill in the information below to create a new article."}
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : isEditing ? "Update" : "Create Article"}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <div className="min-h-[500px] border rounded-xl p-6 bg-card">
            <BasicInfoSection
              form={form}
              authors={authors}
              watchTitle={watchTitle}
              generateSlug={generateSlug}
            />
            <ContentSection form={form} watchContent={watchContent} />
            <SeoSection form={form} />
            <SettingsSection form={form} />
            <MediaSection
              featuredImage={featuredImage}
              setFeaturedImage={setFeaturedImage}
              gallery={gallery}
              setGallery={setGallery}
              handleImageUpload={handleImageUpload}
              handleGalleryUpload={handleGalleryUpload}
            />
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
                : "Create Article"}
          </Button>
        </div>
      </form>
    </div>
  );
}
