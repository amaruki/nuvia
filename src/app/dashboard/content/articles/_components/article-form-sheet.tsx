"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  FormActions,
  FormSection,
  FormSheet,
  type FormSheetState,
} from "@/components/dashboard/form-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles } from "@/lib/hooks/use-articles";
import {
  articleFormSchema,
  type ArticleFormInput,
  type ArticleFormValues,
} from "@/lib/validation/content.validation";
import type { Article, ArticleFormData } from "@/types/article";

import { BasicInfoSection } from "./article-form/basic-info-section";
import { ContentSection } from "./article-form/content-section";
import { MediaSection } from "./article-form/media-section";
import { SeoSection } from "./article-form/seo-section";
import { SettingsSection } from "./article-form/settings-section";

const FORM_ID = "article-form";

// articleFormSchema constrains priority to 0-10, while hydrated articles
// carry the wire-level 0-100 range. Clamp the seed so editing never starts
// invalid for a field the form does not expose.
const PRIORITY_MIN = 0;
const PRIORITY_MAX = 10;

export interface ArticleFormSheetProps {
  sheet: FormSheetState;
  onCreate: (data: ArticleFormData) => Promise<Article>;
  onUpdate: (id: string, data: ArticleFormData) => Promise<Article>;
  /** Called after a successful save so page-owned views stay in sync. */
  onSaved?: () => void;
}

function clampPriority(priority: number | undefined): number {
  return Math.min(PRIORITY_MAX, Math.max(PRIORITY_MIN, priority ?? 5));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Issue #17: DateField round-trips YYYY-MM-DD strings. */
function toDateInputValue(date: Date | undefined): string {
  if (!date) return "";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function toFormState(article: Article | null): ArticleFormValues {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    type: article?.type ?? "tutorial",
    category: article?.category ?? "technology",
    format: article?.format ?? "standard",
    difficulty: article?.difficulty ?? "beginner",
    status: article?.status ?? "draft",
    scheduledFor: toDateInputValue(article?.scheduledFor),
    authorId: article?.author.id ?? "",
    coAuthorIds: article?.coAuthors?.map((author) => author.id) ?? [],
    reviewerId: article?.reviewer?.id ?? "",
    tagIds: article?.tags.map((tag) => tag.id) ?? [],
    seriesId: article?.series?.id ?? "",
    visibility: article?.visibility ?? "public",
    commentsEnabled: article?.commentsEnabled ?? true,
    sharingEnabled: article?.sharingEnabled ?? true,
    downloadEnabled: article?.downloadEnabled ?? true,
    isFeatured: article?.isFeatured ?? false,
    isPinned: article?.isPinned ?? false,
    priority: clampPriority(article?.priority),
    seo: {
      title: article?.seo?.title ?? "",
      description: article?.seo?.description ?? "",
      keywords: article?.seo?.keywords ?? [],
      ogImage: article?.seo?.ogImage ?? "",
    },
  };
}

/**
 * URL-driven create/edit sheet for articles (CODING_STANDARD "Dashboard
 * forms"). The sheet opens on ?form=new / ?form=<id> and shares one form
 * component for both modes.
 */
export function ArticleFormSheet({ sheet, onCreate, onUpdate, onSaved }: ArticleFormSheetProps) {
  const { filteredArticles, getArticle, loading } = useArticles();
  const editingArticle = sheet.mode === "edit" && sheet.editId ? getArticle(sheet.editId) : null;

  // Author choices come from the real articles (backlog F2): the content
  // API stores authors on each item, so existing authors are the honest
  // source. This hook instance shares the content query cache with the
  // page's own useArticles call.
  const authors = useMemo(
    () =>
      Array.from(new Map(filteredArticles.map((item) => [item.author.id, item.author])).values()),
    [filteredArticles],
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);

  const form = useForm<ArticleFormInput, unknown, ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target loads; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    form.reset(toFormState(editingArticle));
    setSubmitError(null);
    setFeaturedImage(editingArticle?.featuredImage ?? "");
    setGallery(editingArticle?.gallery ?? []);
  }, [sheet.mode, sheet.editId, editingArticle, form]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => setFeaturedImage(loadEvent.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (loadEvent) =>
          setGallery((previous) => [...previous, loadEvent.target?.result as string]);
        reader.readAsDataURL(file);
      }
    }
  };

  const onSubmit = async (values: ArticleFormValues) => {
    setSubmitError(null);
    const payload: ArticleFormData = {
      ...values,
      slug: values.slug?.trim() || slugify(values.title),
      // Issue #17: scheduled writes carry the editor's publish date; the
      // publisher gates on it. Dates travel as ISO strings over JSON.
      scheduledFor: values.scheduledFor ? new Date(values.scheduledFor) : undefined,
      featuredImage,
      gallery,
      attachments: [],
    };
    try {
      if (editingArticle) {
        await onUpdate(editingArticle.id, payload);
        toast.success("Article updated");
      } else {
        await onCreate(payload);
        toast.success("Article created");
      }
      onSaved?.();
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the article.";
      setSubmitError(message);
    }
  };

  const { isDirty, isSubmitting } = form.formState;
  const isEdit = sheet.mode === "edit";
  const isLoadingEntity = isEdit && !editingArticle && loading;
  const entityMissing = isEdit && !editingArticle && !loading;

  return (
    <FormSheet
      open={sheet.open}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit article" : "Create article"}
      description={
        isEdit
          ? "Update the article details below."
          : "Articles share tutorials, guides, and stories with the community."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        editingArticle || !isEdit ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Article"
          />
        ) : undefined
      }
    >
      {isLoadingEntity ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64" />
        </div>
      ) : entityMissing ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This article no longer exists. Close the sheet and refresh the list.
            </AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={sheet.close}>
            Close
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-6 p-6"
          >
            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormSection title="Basic information">
              <BasicInfoSection authors={authors} />
            </FormSection>
            <FormSection title="Content">
              <ContentSection form={form} watchContent={form.watch("content")} />
            </FormSection>
            <FormSection title="SEO">
              <SeoSection />
            </FormSection>
            <FormSection title="Settings">
              <SettingsSection />
            </FormSection>
            <FormSection
              title="Media"
              description="Featured image and gallery are merged into the article on save."
            >
              <MediaSection
                featuredImage={featuredImage}
                setFeaturedImage={setFeaturedImage}
                gallery={gallery}
                setGallery={setGallery}
                handleImageUpload={handleImageUpload}
                handleGalleryUpload={handleGalleryUpload}
              />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
