"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import {
  announcementFormSchema,
  type AnnouncementFormInput,
  type AnnouncementFormValues,
} from "@/lib/validation/content.validation";
import type { Announcement, AnnouncementFormData, Attachment } from "@/types/announcement";

import { AttachmentsSection } from "./announcement-form/attachments-section";
import { ContentSection } from "./announcement-form/content-section";
import { DisplaySection } from "./announcement-form/display-section";
import { PublishingSection } from "./announcement-form/publishing-section";
import { TargetingSection } from "./announcement-form/targeting-section";
import type { NewAttachment } from "./announcement-form/types";

const FORM_ID = "announcement-form";

const EMPTY_NEW_ATTACHMENT: NewAttachment = { name: "", url: "", type: "document" };

export interface AnnouncementFormSheetProps {
  sheet: FormSheetState;
  onCreate: (data: AnnouncementFormData) => Promise<Announcement>;
  onUpdate: (id: string, data: AnnouncementFormData) => Promise<Announcement>;
  /** Called after a successful save so page-owned views stay in sync. */
  onSaved?: () => void;
}

function toFormState(announcement: Announcement | null): AnnouncementFormValues {
  return {
    title: announcement?.title ?? "",
    excerpt: announcement?.excerpt ?? "",
    content: announcement?.content ?? "",
    type: announcement?.type ?? "general",
    priority: announcement?.priority ?? "medium",
    targetAudience: announcement?.targetAudience ?? "all_members",
    status: announcement?.status ?? "draft",
    // Issue #17: DateField round-trips YYYY-MM-DD strings.
    scheduledFor: announcement?.scheduledFor
      ? new Date(announcement.scheduledFor).toISOString().slice(0, 10)
      : "",
    authorId: announcement?.author.id ?? "",
    tagIds: announcement?.tags.map((tag) => tag.id) ?? [],
    featuredImage: announcement?.featuredImage,
    expiresAt: announcement?.expiresAt,
    isPinned: announcement?.isPinned ?? false,
    isUrgent: announcement?.isUrgent ?? false,
    requiresAcknowledgment: announcement?.requiresAcknowledgment ?? false,
    sendEmailNotification: announcement?.sendEmailNotification ?? false,
    sendPushNotification: announcement?.sendPushNotification ?? false,
    displayOnHomepage: announcement?.displayOnHomepage ?? true,
    displayInDashboard: announcement?.displayInDashboard ?? true,
    visibility: announcement?.visibility ?? "public",
    allowedRoles: announcement?.allowedRoles ?? [],
    allowedChapters: announcement?.allowedChapters ?? [],
    allowedCommittees: announcement?.allowedCommittees ?? [],
    commentsEnabled: announcement?.commentsEnabled ?? false,
    sharingEnabled: announcement?.sharingEnabled ?? true,
    downloadEnabled: announcement?.downloadEnabled ?? false,
    isFeatured: announcement?.isFeatured ?? false,
  };
}

/**
 * URL-driven create/edit sheet for announcements (CODING_STANDARD
 * "Dashboard forms"). The sheet opens on ?form=new / ?form=<id> and shares
 * one form component for both modes.
 */
export function AnnouncementFormSheet({
  sheet,
  onCreate,
  onUpdate,
  onSaved,
}: AnnouncementFormSheetProps) {
  const { filteredAnnouncements, getAnnouncement, loading } = useAnnouncements();
  const editingAnnouncement =
    sheet.mode === "edit" && sheet.editId ? getAnnouncement(sheet.editId) : null;

  // Author choices come from the real announcements (backlog F2): the
  // content API stores authors on each item, so existing authors are the
  // honest source. This hook instance shares the content query cache with
  // the page's own useAnnouncements call.
  const authors = useMemo(
    () =>
      Array.from(
        new Map(filteredAnnouncements.map((item) => [item.author.id, item.author])).values(),
      ),
    [filteredAnnouncements],
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachment, setNewAttachment] = useState<NewAttachment>(EMPTY_NEW_ATTACHMENT);

  const form = useForm<AnnouncementFormInput, unknown, AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target loads; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    form.reset(toFormState(editingAnnouncement));
    setSubmitError(null);
    setAttachments(
      editingAnnouncement?.attachments?.map(({ id, name, url, type }) => ({
        id,
        name,
        url,
        type,
      })) ?? [],
    );
    setNewAttachment(EMPTY_NEW_ATTACHMENT);
  }, [sheet.mode, sheet.editId, editingAnnouncement, form]);

  const addAttachment = () => {
    if (newAttachment.name && newAttachment.url) {
      setAttachments((previous) => [...previous, { ...newAttachment, id: Date.now().toString() }]);
      setNewAttachment(EMPTY_NEW_ATTACHMENT);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((previous) => previous.filter((attachment) => attachment.id !== id));
  };

  const onSubmit = async (values: AnnouncementFormValues) => {
    setSubmitError(null);
    const payload: AnnouncementFormData = {
      ...values,
      category: "announcements", // Always announcements
      // Issue #17: scheduled writes carry the editor's publish date; the
      // publisher gates on it. Dates travel as ISO strings over JSON.
      scheduledFor: values.scheduledFor ? new Date(values.scheduledFor) : undefined,
      attachments:
        attachments.length > 0
          ? attachments.map((attachment) => ({
              id: attachment.id,
              name: attachment.name,
              url: attachment.url,
              size: 0, // Default size since we don't have it
              type: attachment.type,
            }))
          : undefined,
    };
    try {
      if (editingAnnouncement) {
        await onUpdate(editingAnnouncement.id, payload);
        toast.success("Announcement updated");
      } else {
        await onCreate(payload);
        toast.success("Announcement created");
      }
      onSaved?.();
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the announcement.";
      setSubmitError(message);
    }
  };

  const { isDirty, isSubmitting } = form.formState;
  const isEdit = sheet.mode === "edit";
  const isLoadingEntity = isEdit && !editingAnnouncement && loading;
  const entityMissing = isEdit && !editingAnnouncement && !loading;

  return (
    <FormSheet
      open={sheet.open}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit announcement" : "Create announcement"}
      description={
        isEdit
          ? "Update the announcement details below."
          : "Announcements keep members informed about news, events, and urgent updates."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        editingAnnouncement || !isEdit ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Announcement"
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
              This announcement no longer exists. Close the sheet and refresh the list.
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

            <FormSection title="Content">
              <ContentSection form={form} authors={authors} />
            </FormSection>
            <FormSection
              title="Targeting"
              description="Choose who sees this announcement, how prominently, and when it expires."
            >
              <TargetingSection form={form} />
            </FormSection>
            <FormSection title="Publishing">
              <PublishingSection />
            </FormSection>
            <FormSection title="Display and notifications">
              <DisplaySection />
            </FormSection>
            <FormSection title="Attachments" description="Link supporting documents or resources.">
              <AttachmentsSection
                attachments={attachments}
                newAttachment={newAttachment}
                onNewAttachmentChange={setNewAttachment}
                onAddAttachment={addAttachment}
                onRemoveAttachment={removeAttachment}
              />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
