"use client";

import { useEffect, useState } from "react";
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
import {
  chapterFormSchema,
  type ChapterFormValues,
} from "@/lib/validation/organization.validation";
import type { Chapter, ChapterFormData } from "@/types/chapter.types";

import { BasicInfoSection } from "./basic-info-section";
import { ContactSection } from "./contact-section";
import { LocationSection } from "./location-section";
import { SettingsSection } from "./settings-section";

const FORM_ID = "chapter-form";

export interface ChapterFormSheetProps {
  sheet: FormSheetState;
  /** The page's chapter list; the sheet resolves ?form=<id> against it. */
  chapters: Chapter[];
  onCreate: (data: ChapterFormData) => Promise<unknown>;
  onUpdate: (id: string, updates: Partial<ChapterFormData>) => Promise<unknown>;
  /** Called after a successful save so page-owned views stay in sync. */
  onSaved?: () => void;
}

function toFormState(chapter: Chapter | null): ChapterFormValues {
  return {
    name: chapter?.name ?? "",
    displayName: chapter?.displayName ?? "",
    description: chapter?.description ?? "",
    status: chapter?.status ?? "pending",
    location: {
      address: chapter?.location.address ?? "",
      city: chapter?.location.city ?? "",
      state: chapter?.location.state ?? "",
      country: chapter?.location.country ?? "",
      postalCode: chapter?.location.postalCode ?? "",
      timezone: chapter?.location.timezone ?? "America/New_York",
      region: chapter?.location.region ?? "",
    },
    contactInfo: {
      email: chapter?.contactInfo.email ?? "",
      phone: chapter?.contactInfo.phone ?? "",
      website: chapter?.contactInfo.website ?? "",
      address: chapter?.contactInfo.address ?? "",
      mailingAddress: chapter?.contactInfo.mailingAddress ?? "",
    },
    socialMedia: {
      facebook: chapter?.socialMedia.facebook ?? "",
      twitter: chapter?.socialMedia.twitter ?? "",
      linkedin: chapter?.socialMedia.linkedin ?? "",
      instagram: chapter?.socialMedia.instagram ?? "",
      youtube: chapter?.socialMedia.youtube ?? "",
    },
    settings: {
      allowOnlineRegistration: chapter?.settings.allowOnlineRegistration ?? true,
      requireApproval: chapter?.settings.requireApproval ?? false,
      membershipDues: chapter?.settings.membershipDues ?? 100,
      meetingFrequency: chapter?.settings.meetingFrequency ?? "monthly",
      meetingDay: chapter?.settings.meetingDay ?? "",
      meetingTime: chapter?.settings.meetingTime ?? "",
      autoRenewMembership: chapter?.settings.autoRenewMembership ?? true,
      sendReminders: chapter?.settings.sendReminders ?? true,
      publicDirectory: chapter?.settings.publicDirectory ?? true,
    },
    parentChapterId: chapter?.parentChapterId ?? "",
  };
}

/**
 * URL-driven create/edit sheet for chapters (CODING_STANDARD "Dashboard
 * forms"). Opens on ?form=new / ?form=<id>; one form serves both modes.
 * The chapter mutations update the hook's local cache without toasting, so
 * success toasts live here, and onSaved keeps the Chapters tab's own
 * paginated query in sync.
 */
export function ChapterFormSheet({
  sheet,
  chapters,
  onCreate,
  onUpdate,
  onSaved,
}: ChapterFormSheetProps) {
  const editingChapter =
    sheet.mode === "edit" ? (chapters.find((item) => item.id === sheet.editId) ?? null) : null;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target changes; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    form.reset(toFormState(editingChapter));
    setSubmitError(null);
  }, [sheet.mode, sheet.editId, editingChapter, form]);

  const onSubmit = async (values: ChapterFormValues) => {
    setSubmitError(null);
    try {
      if (editingChapter) {
        await onUpdate(editingChapter.id, values);
        toast.success("Chapter updated");
      } else {
        await onCreate(values);
        toast.success("Chapter created");
      }
      onSaved?.();
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the chapter.";
      setSubmitError(message);
    }
  };

  const { isDirty, isSubmitting } = form.formState;
  const isEdit = sheet.mode === "edit";

  return (
    <FormSheet
      open={sheet.mode !== "closed"}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit chapter" : "Create chapter"}
      description={
        isEdit
          ? "Update the chapter details below."
          : "Fill in the chapter details to set up a new chapter."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        editingChapter || !isEdit ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Chapter"
          />
        ) : undefined
      }
    >
      {isEdit && !editingChapter ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This chapter no longer exists. Close the sheet and refresh the list.
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
              <BasicInfoSection form={form} />
            </FormSection>
            <FormSection title="Location">
              <LocationSection />
            </FormSection>
            <FormSection title="Contact and social media">
              <ContactSection form={form} />
            </FormSection>
            <FormSection title="Settings">
              <SettingsSection form={form} />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
