"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceFormData } from "@/types/committee";
import { logger } from "@/lib/logger";
import { workspaceFormSchema, WorkspaceFormValues } from "./schema";
import { AddWorkspaceFormProps } from "./types";
import { BasicInfoSection } from "./basic-info-section";
import { SettingsSection } from "./settings-section";
import { PermissionsSection } from "./permissions-section";

export function AddWorkspaceForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: AddWorkspaceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFileType, setNewFileType] = useState("");

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "general",
      settings: {
        isPublic: false,
        allowGuestAccess: false,
        requireApproval: true,
        enableNotifications: true,
        autoArchiveDays: 365,
        maxFileSize: 50,
        allowedFileTypes: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
        memberPermissions: [
          {
            role: "chair",
            permissions: [
              "view",
              "edit",
              "delete",
              "upload",
              "download",
              "manage_members",
              "manage_settings",
            ],
          },
          {
            role: "member",
            permissions: ["view", "download"],
          },
        ],
      },
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form.reset]);

  const handleAddFileType = () => {
    if (newFileType.trim()) {
      const currentFileTypes = form.getValues("settings.allowedFileTypes") || [];
      form.setValue("settings.allowedFileTypes", [...currentFileTypes, newFileType.trim()]);
      setNewFileType("");
    }
  };

  const handleRemoveFileType = (index: number) => {
    const currentFileTypes = form.getValues("settings.allowedFileTypes") || [];
    form.setValue(
      "settings.allowedFileTypes",
      currentFileTypes.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = async (values: WorkspaceFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values as WorkspaceFormData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      logger.error("Error submitting workspace form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Workspace" : "Create New Workspace"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update workspace information and settings."
              : "Create a new collaborative workspace for your committee."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <BasicInfoSection form={form} />

          <SettingsSection
            form={form}
            newFileType={newFileType}
            onNewFileTypeChange={setNewFileType}
            onAddFileType={handleAddFileType}
            onRemoveFileType={handleRemoveFileType}
          />

          <PermissionsSection form={form} />

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
              {isSubmitting ? "Saving..." : isEditing ? "Update Workspace" : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
