"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  WorkspaceFormData,
  WorkspaceType,
  WorkspaceStatus,
  CommitteeRole,
  Permission,
} from "@/types/committee.types";
import { X, Plus, Trash2 } from "lucide-react";
import { logger } from "@/lib/logger";

const workspaceFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  type: z.enum(["general", "project", "document", "discussion", "meeting"] as const),
  settings: z.object({
    isPublic: z.boolean(),
    allowGuestAccess: z.boolean(),
    requireApproval: z.boolean(),
    enableNotifications: z.boolean(),
    autoArchiveDays: z
      .number()
      .min(1, "Auto archive must be at least 1 day")
      .max(1095, "Auto archive must be less than 3 years"),
    maxFileSize: z
      .number()
      .min(1, "Max file size must be at least 1MB")
      .max(1000, "Max file size must be less than 1000MB"),
    allowedFileTypes: z.array(z.string()).min(1, "At least one file type must be allowed"),
    memberPermissions: z
      .array(
        z.object({
          role: z.enum([
            "chair",
            "co_chair",
            "secretary",
            "treasurer",
            "member",
            "advisor",
          ] as const),
          permissions: z.array(
            z.enum([
              "view",
              "edit",
              "delete",
              "upload",
              "download",
              "manage_members",
              "manage_settings",
            ] as const),
          ),
        }),
      )
      .min(1, "At least one permission set is required"),
  }),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

interface AddWorkspaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  initialData?: Partial<WorkspaceFormData>;
  isEditing?: boolean;
}

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

  const handleAddPermissionSet = () => {
    const currentPermissions = form.getValues("settings.memberPermissions") || [];
    form.setValue("settings.memberPermissions", [
      ...currentPermissions,
      {
        role: "member",
        permissions: ["view", "download"],
      },
    ]);
  };

  const handleRemovePermissionSet = (index: number) => {
    const currentPermissions = form.getValues("settings.memberPermissions") || [];
    form.setValue(
      "settings.memberPermissions",
      currentPermissions.filter((_, i) => i !== index),
    );
  };

  const handlePermissionToggle = (permissionIndex: number, permission: Permission) => {
    const currentPermissions = form.getValues("settings.memberPermissions") || [];
    const permissionSet = currentPermissions[permissionIndex];

    if (permissionSet) {
      const updatedPermissions = permissionSet.permissions.includes(permission)
        ? permissionSet.permissions.filter((p) => p !== permission)
        : [...permissionSet.permissions, permission];

      form.setValue("settings.memberPermissions", [
        ...currentPermissions.slice(0, permissionIndex),
        { ...permissionSet, permissions: updatedPermissions },
        ...currentPermissions.slice(permissionIndex + 1),
      ]);
    }
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

  const typeOptions: { value: WorkspaceType; label: string; description: string }[] = [
    {
      value: "general",
      label: "General",
      description: "All-purpose workspace for general collaboration",
    },
    { value: "project", label: "Project", description: "Focused workspace for specific projects" },
    {
      value: "document",
      label: "Document",
      description: "Workspace optimized for document management",
    },
    {
      value: "discussion",
      label: "Discussion",
      description: "Workspace for forums and discussions",
    },
    { value: "meeting", label: "Meeting", description: "Workspace for meeting coordination" },
  ];

  const roleOptions: { value: CommitteeRole; label: string }[] = [
    { value: "chair", label: "Chair" },
    { value: "co_chair", label: "Co-Chair" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "member", label: "Member" },
    { value: "advisor", label: "Advisor" },
  ];

  const permissionOptions: { value: Permission; label: string; description: string }[] = [
    { value: "view", label: "View", description: "Can view content" },
    { value: "edit", label: "Edit", description: "Can edit content" },
    { value: "delete", label: "Delete", description: "Can delete content" },
    { value: "upload", label: "Upload", description: "Can upload files" },
    { value: "download", label: "Download", description: "Can download files" },
    {
      value: "manage_members",
      label: "Manage Members",
      description: "Can manage workspace members",
    },
    {
      value: "manage_settings",
      label: "Manage Settings",
      description: "Can manage workspace settings",
    },
  ];

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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Executive Committee Workspace"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Workspace Type</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value as WorkspaceType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the workspace purpose and use case..."
                  rows={3}
                  {...form.register("description")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Workspace Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="isPublic">Visibility</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPublic"
                        checked={form.watch("settings.isPublic")}
                        onCheckedChange={(checked) =>
                          form.setValue("settings.isPublic", checked as boolean)
                        }
                      />
                      <Label htmlFor="isPublic" className="text-sm font-normal">
                        Public workspace
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Public workspaces can be accessed by all organization members
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Access Control</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allowGuestAccess"
                        checked={form.watch("settings.allowGuestAccess")}
                        onCheckedChange={(checked) =>
                          form.setValue("settings.allowGuestAccess", checked as boolean)
                        }
                      />
                      <Label htmlFor="allowGuestAccess" className="text-sm font-normal">
                        Allow guest access
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requireApproval"
                        checked={form.watch("settings.requireApproval")}
                        onCheckedChange={(checked) =>
                          form.setValue("settings.requireApproval", checked as boolean)
                        }
                      />
                      <Label htmlFor="requireApproval" className="text-sm font-normal">
                        Require approval to join
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enableNotifications">Notifications</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableNotifications"
                      checked={form.watch("settings.enableNotifications")}
                      onCheckedChange={(checked) =>
                        form.setValue("settings.enableNotifications", checked as boolean)
                      }
                    />
                    <Label htmlFor="enableNotifications" className="text-sm font-normal">
                      Enable notifications
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoArchiveDays">Auto Archive</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="autoArchiveDays"
                      type="number"
                      placeholder="365"
                      {...form.register("settings.autoArchiveDays", { valueAsNumber: true })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  {form.formState.errors.settings?.autoArchiveDays && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.settings.autoArchiveDays.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="maxFileSize"
                      type="number"
                      placeholder="50"
                      {...form.register("settings.maxFileSize", { valueAsNumber: true })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">MB</span>
                  </div>
                  {form.formState.errors.settings?.maxFileSize && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.settings.maxFileSize.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed File Types</Label>
                <div className="space-y-2">
                  {form.watch("settings.allowedFileTypes")?.map((fileType, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={fileType}
                        onChange={(e) => {
                          const current = form.getValues("settings.allowedFileTypes") || [];
                          current[index] = e.target.value;
                          form.setValue("settings.allowedFileTypes", current);
                        }}
                        placeholder=".pdf"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFileType(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Input
                      value={newFileType}
                      onChange={(e) => setNewFileType(e.target.value)}
                      placeholder="Add new file type..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFileType();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddFileType}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {form.formState.errors.settings?.allowedFileTypes && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.settings.allowedFileTypes.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Member Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {form.watch("settings.memberPermissions")?.map((permissionSet, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Select
                          value={permissionSet.role}
                          onValueChange={(value) => {
                            const current = form.getValues("settings.memberPermissions") || [];
                            form.setValue("settings.memberPermissions", [
                              ...current.slice(0, index),
                              { ...permissionSet, role: value as CommitteeRole },
                              ...current.slice(index + 1),
                            ]);
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePermissionSet(index)}
                        disabled={form.watch("settings.memberPermissions")?.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                      {permissionOptions.map((permission) => (
                        <div key={permission.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`permission-${index}-${permission.value}`}
                            checked={permissionSet.permissions.includes(permission.value)}
                            onCheckedChange={() => handlePermissionToggle(index, permission.value)}
                          />
                          <Label
                            htmlFor={`permission-${index}-${permission.value}`}
                            className="text-sm font-normal cursor-pointer"
                            title={permission.description}
                          >
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPermissionSet}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Permission Set
                </Button>
              </div>
            </CardContent>
          </Card>

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
