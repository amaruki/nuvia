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
import { usePublications } from "@/lib/hooks/use-publications";
import {
  publicationFormSchema,
  type PublicationFormInput,
  type PublicationFormValues,
} from "@/lib/validation/content.validation";
import type { Publication, PublicationFormData } from "@/types/publication";

import { BasicInfoSection } from "./publication-form/basic-info-section";
import { ContentSection } from "./publication-form/content-section";
import { MediaSection } from "./publication-form/media-section";
import { SeoSection } from "./publication-form/seo-section";
import { SettingsSection } from "./publication-form/settings-section";

const FORM_ID = "publication-form";

// publicationFormSchema constrains priority to 0-10, while hydrated
// publications carry the wire-level 0-100 range. Clamp the seed so editing
// never starts invalid for a field the form does not expose.
const PRIORITY_MIN = 0;
const PRIORITY_MAX = 10;

export interface PublicationFormSheetProps {
  sheet: FormSheetState;
  onCreate: (data: PublicationFormData) => Promise<Publication>;
  onUpdate: (id: string, data: PublicationFormData) => Promise<Publication>;
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

function toFormState(publication: Publication | null): PublicationFormValues {
  return {
    title: publication?.title ?? "",
    slug: publication?.slug ?? "",
    excerpt: publication?.excerpt ?? "",
    content: publication?.content ?? "",
    type: publication?.type ?? "article",
    category: publication?.category ?? "technology",
    status: publication?.status ?? "draft",
    authorId: publication?.author.id ?? "",
    coAuthorIds: publication?.coAuthors?.map((author) => author.id) ?? [],
    tagIds: publication?.tags.map((tag) => tag.id) ?? [],
    difficulty: publication?.difficulty ?? "beginner",
    visibility: publication?.visibility ?? "public",
    commentsEnabled: publication?.commentsEnabled ?? true,
    sharingEnabled: publication?.sharingEnabled ?? true,
    downloadEnabled: publication?.downloadEnabled ?? true,
    isFeatured: publication?.isFeatured ?? false,
    isPinned: publication?.isPinned ?? false,
    priority: clampPriority(publication?.priority),
    seo: {
      title: publication?.seo?.title ?? "",
      description: publication?.seo?.description ?? "",
      keywords: publication?.seo?.keywords ?? [],
      ogImage: publication?.seo?.ogImage ?? "",
    },
  };
}

/**
 * URL-driven create/edit sheet for publications (CODING_STANDARD "Dashboard
 * forms"). The sheet opens on ?form=new / ?form=<id> and shares one form
 * component for both modes.
 */
export function PublicationFormSheet({
  sheet,
  onCreate,
  onUpdate,
  onSaved,
}: PublicationFormSheetProps) {
  const { filteredPublications, getPublication, loading } = usePublications();
  const editingPublication =
    sheet.mode === "edit" && sheet.editId ? getPublication(sheet.editId) : null;

  // Author choices come from the real publications (backlog F2): the
  // content API stores authors on each item, so existing authors are the
  // honest source. This hook instance shares the content query cache with
  // the page's own usePublications call.
  const authors = useMemo(
    () =>
      Array.from(
        new Map(filteredPublications.map((item) => [item.author.id, item.author])).values(),
      ),
    [filteredPublications],
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);

  const form = useForm<PublicationFormInput, unknown, PublicationFormValues>({
    resolver: zodResolver(publicationFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target loads; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    form.reset(toFormState(editingPublication));
    setSubmitError(null);
    setFeaturedImage(editingPublication?.featuredImage ?? "");
    setGallery(editingPublication?.gallery ?? []);
  }, [sheet.mode, sheet.editId, editingPublication, form]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => setFeaturedImage(loadEvent.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: PublicationFormValues) => {
    setSubmitError(null);
    const payload: PublicationFormData = {
      ...values,
      slug: values.slug?.trim() || slugify(values.title),
      featuredImage,
      gallery,
      attachments: [],
    };
    try {
      if (editingPublication) {
        await onUpdate(editingPublication.id, payload);
        toast.success("Publication updated");
      } else {
        await onCreate(payload);
        toast.success("Publication created");
      }
      onSaved?.();
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the publication.";
      setSubmitError(message);
    }
  };

  const { isDirty, isSubmitting } = form.formState;
  const isEdit = sheet.mode === "edit";
  const isLoadingEntity = isEdit && !editingPublication && loading;
  const entityMissing = isEdit && !editingPublication && !loading;

  return (
    <FormSheet
      open={sheet.open}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit publication" : "Create publication"}
      description={
        isEdit
          ? "Update the publication details below."
          : "Publications share articles, blog posts, newsletters, and reports."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        editingPublication || !isEdit ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Publication"
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
              This publication no longer exists. Close the sheet and refresh the list.
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
              description="The featured image is merged into the publication on save."
            >
              <MediaSection
                featuredImage={featuredImage}
                setFeaturedImage={setFeaturedImage}
                handleImageUpload={handleImageUpload}
              />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
