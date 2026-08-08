"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";
import { chapterFormSchema, ChapterFormValues } from "./schema";
import { AddChapterFormProps } from "./types";
import { BasicInfoTab } from "./basic-info-tab";
import { LocationTab } from "./location-tab";
import { ContactTab } from "./contact-tab";
import { SettingsTab } from "./settings-tab";

export function AddChapterForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: AddChapterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: initialData || {
      name: "",
      displayName: "",
      description: "",
      status: "pending",
      location: {
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        timezone: "America/New_York",
        region: "",
      },
      contactInfo: {
        email: "",
        phone: "",
        website: "",
        address: "",
        mailingAddress: "",
      },
      socialMedia: {
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        youtube: "",
      },
      settings: {
        allowOnlineRegistration: true,
        requireApproval: false,
        membershipDues: 100,
        meetingFrequency: "monthly",
        meetingDay: "",
        meetingTime: "",
        autoRenewMembership: true,
        sendReminders: true,
        publicDirectory: true,
      },
      parentChapterId: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const handleSubmit = async (values: ChapterFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      logger.error("Error submitting chapter form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? "Edit Chapter" : "Create New Chapter"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <BasicInfoTab form={form} />
            <LocationTab form={form} />
            <ContactTab form={form} />
            <SettingsTab form={form} />
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Chapter" : "Create Chapter"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
