"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  type AnnouncementFormData,
  type AnnouncementFormValues,
  type Attachment,
} from "@/types/announcement";

import { AttachmentsTab } from "./attachments-tab";
import { ContentTab } from "./content-tab";
import { DisplayTab } from "./display-tab";
import { SettingsTab } from "./settings-tab";
import { announcementFormSchema } from "./schema";
import type { AddAnnouncementFormProps } from "./types";

export function AddAnnouncementForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AddAnnouncementFormProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachment, setNewAttachment] = useState({
    name: "",
    url: "",
    type: "document" as const,
  });
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<z.input<typeof announcementFormSchema>, unknown, AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      type: "general",
      priority: "medium",
      targetAudience: "all_members",
      status: "draft" as const,
      authorId: "",
      tagIds: [],
      featuredImage: "",
      expiresAt: undefined,
      isPinned: false,
      isUrgent: false,
      requiresAcknowledgment: false,
      sendEmailNotification: false,
      sendPushNotification: false,
      displayOnHomepage: true,
      displayInDashboard: true,
      visibility: "public" as const,
      allowedRoles: [],
      allowedChapters: [],
      allowedCommittees: [],
      commentsEnabled: false,
      sharingEnabled: true,
      downloadEnabled: false,
      isFeatured: false,
      ...initialData,
    },
  });

  const handleSubmit = (values: AnnouncementFormValues) => {
    const formData: AnnouncementFormData = {
      ...values,
      category: "announcements", // Always announcements
      attachments:
        attachments.length > 0
          ? attachments.map((att) => ({
              id: att.id,
              name: att.name,
              url: att.url,
              size: 0, // Default size since we don't have it
              type: att.type,
            }))
          : undefined,
    };
    onSubmit(formData);
  };

  const addAttachment = () => {
    if (newAttachment.name && newAttachment.url) {
      setAttachments([...attachments, { ...newAttachment, id: Date.now().toString() }]);
      setNewAttachment({ name: "", url: "", type: "document" });
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((att) => att.id !== id));
  };

  const { watch } = form;
  const formValues = watch();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
          <CardDescription>Create a new announcement for your organization members</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <ContentTab form={form} formValues={formValues} />
              <SettingsTab form={form} formValues={formValues} />
              <DisplayTab form={form} formValues={formValues} />
              <AttachmentsTab
                attachments={attachments}
                newAttachment={newAttachment}
                onNewAttachmentChange={setNewAttachment}
                onAddAttachment={addAttachment}
                onRemoveAttachment={removeAttachment}
              />
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Announcement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
