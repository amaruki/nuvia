"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  X,
  Calendar,
  Eye,
  Settings,
  User,
  Tag,
  Image as ImageIcon,
  FileText,
  Star,
  Pin,
  Shield,
  Users,
  Building,
  Briefcase,
  ChevronLeft,
  Timer,
  Zap,
  BookOpen,
} from "lucide-react";
import {
  ArticleFormData,
  ArticleType,
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ArticleStatus,
  ARTICLE_TYPES,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES,
  ARTICLE_DIFFICULTIES,
  ARTICLE_FORMATS,
} from "@/types/article.types";
import { mockArticles } from "@/lib/data/mock-article-data";
import { cn } from "@/lib/utils";

// Form schema for articles
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().optional(),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(ARTICLE_TYPES),
  category: z.enum(ARTICLE_CATEGORIES),
  format: z.enum(ARTICLE_FORMATS),
  difficulty: z.enum(ARTICLE_DIFFICULTIES),
  status: z.enum(ARTICLE_STATUSES),
  authorId: z.string().min(1, "Author is required"),
  coAuthorIds: z.array(z.string()).optional(),
  reviewerId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  seriesId: z.string().optional(),
  visibility: z.enum(["public", "members_only", "premium_only", "chapter_only", "committee_only"]),
  commentsEnabled: z.boolean(),
  sharingEnabled: z.boolean(),
  downloadEnabled: z.boolean(),
  isFeatured: z.boolean(),
  isPinned: z.boolean(),
  priority: z.number().min(0).max(10),
  seo: z.object({
    title: z
      .string()
      .min(1, "SEO title is required")
      .max(60, "SEO title must be less than 60 characters"),
    description: z
      .string()
      .min(1, "SEO description is required")
      .max(160, "SEO description must be less than 160 characters"),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }),
});

interface ArticlePageFormProps {
  onSubmit: (data: ArticleFormData) => void;
  initialData?: Partial<ArticleFormData>;
  isEditing?: boolean;
}

export default function ArticlePageForm({
  onSubmit,
  initialData,
  isEditing = false,
}: ArticlePageFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Extract unique authors from mock data
  const mockAuthors = Array.from(new Set(mockArticles.map((a) => a.author.id))).map(
    (id) => mockArticles.find((a) => a.author.id === id)!.author,
  );

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      type: "tutorial",
      category: "technology",
      format: "standard",
      difficulty: "beginner",
      status: "draft",
      authorId: "",
      coAuthorIds: [],
      reviewerId: "",
      tagIds: [],
      seriesId: "",
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

  const handleSubmit = (data: any) => {
    const formDataWithMedia: ArticleFormData = {
      ...data,
      featuredImage,
      gallery,
      attachments,
    };
    onSubmit(formDataWithMedia);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFeaturedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="mt-0 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    placeholder="Enter article title"
                    className={cn(form.formState.errors.title && "border-destructive")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.title.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    placeholder="article-url-slug"
                    value={watchTitle ? generateSlug(watchTitle) : form.watch("slug")}
                    onChange={(e) => form.setValue("slug", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  {...form.register("excerpt")}
                  placeholder="Brief description of the article"
                  rows={3}
                  className={cn(form.formState.errors.excerpt && "border-destructive")}
                />
                {form.formState.errors.excerpt && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.excerpt.message as string}
                  </p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value as ArticleType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="opinion">Opinion</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                      <SelectItem value="research_summary">Research Summary</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(value) => form.setValue("category", value as ArticleCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="industry_trends">Industry Trends</SelectItem>
                      <SelectItem value="best_practices">Best Practices</SelectItem>
                      <SelectItem value="member_stories">Member Stories</SelectItem>
                      <SelectItem value="chapter_news">Chapter News</SelectItem>
                      <SelectItem value="announcements">Announcements</SelectItem>
                      <SelectItem value="career_development">Career Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format *</Label>
                  <Select
                    value={form.watch("format")}
                    onValueChange={(value) => form.setValue("format", value as ArticleFormat)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="listicle">Listicle</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={form.watch("difficulty")}
                    onValueChange={(value) =>
                      form.setValue("difficulty", value as ArticleDifficulty)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="authorId">Primary Author *</Label>
                  <Select
                    value={form.watch("authorId")}
                    onValueChange={(value) => form.setValue("authorId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAuthors.map((author) => (
                        <SelectItem key={author.id} value={author.id}>
                          {author.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as ArticleStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-0 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="content">Full Content *</Label>
                <Textarea
                  id="content"
                  {...form.register("content")}
                  placeholder="Start writing your article..."
                  rows={20}
                  className={cn("font-mono", form.formState.errors.content && "border-destructive")}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{watchContent?.length || 0} characters</span>
                  <span>{Math.ceil((watchContent?.length || 0) / 200)} min read</span>
                </div>
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.content.message as string}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="mt-0 space-y-6">
              <div className="max-w-2xl space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="seo.title">SEO Title</Label>
                  <Input {...form.register("seo.title")} placeholder="Search engine title" />
                  {form.formState.errors.seo && "title" in form.formState.errors.seo && (
                    <p className="text-sm text-destructive">
                      {(form.formState.errors.seo as any).title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo.description">Meta Description</Label>
                  <Textarea
                    {...form.register("seo.description")}
                    rows={4}
                    placeholder="Description for search results..."
                  />
                  {form.formState.errors.seo && "description" in form.formState.errors.seo && (
                    <p className="text-sm text-destructive">
                      {(form.formState.errors.seo as any).description.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo.ogImage">OG Image URL</Label>
                  <Input
                    {...form.register("seo.ogImage")}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0 space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Access & Visibility</h3>
                  <div className="space-y-4">
                    <Select
                      value={form.watch("visibility")}
                      onValueChange={(value) => form.setValue("visibility", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="members_only">Members Only</SelectItem>
                        <SelectItem value="premium_only">Premium Only</SelectItem>
                        <SelectItem value="chapter_only">Chapter Only</SelectItem>
                        <SelectItem value="committee_only">Committee Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={form.watch("isFeatured")}
                        onCheckedChange={(c) => form.setValue("isFeatured", !!c)}
                      />
                      <Label htmlFor="isFeatured">Feature this article</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPinned"
                        checked={form.watch("isPinned")}
                        onCheckedChange={(c) => form.setValue("isPinned", !!c)}
                      />
                      <Label htmlFor="isPinned">Pin this article</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Capabilities</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="comments"
                        checked={form.watch("commentsEnabled")}
                        onCheckedChange={(c) => form.setValue("commentsEnabled", !!c)}
                      />
                      <Label htmlFor="comments">Enable comments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sharing"
                        checked={form.watch("sharingEnabled")}
                        onCheckedChange={(c) => form.setValue("sharingEnabled", !!c)}
                      />
                      <Label htmlFor="sharing">Enable social sharing</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="download"
                        checked={form.watch("downloadEnabled")}
                        onCheckedChange={(c) => form.setValue("downloadEnabled", !!c)}
                      />
                      <Label htmlFor="download">Enable downloads</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
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
