"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  FormActions,
  FormSection,
  FormSheet,
  type FormSheetState,
} from "@/components/dashboard/form-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { DEFAULT_FILTERS } from "@/lib/hooks/use-workspaces/constants";
import { useFilteredWorkspaces } from "@/lib/hooks/use-workspaces/use-filtered-workspaces";
import {
  workspaceFormSchema,
  type WorkspaceFormValues,
} from "@/lib/validation/organization.validation";
import type { CommitteeWorkspace, WorkspaceFormData } from "@/types/committee";

import { BasicInfoSection } from "./basic-info-section";
import { PermissionsSection } from "./permissions-section";
import { SettingsSection } from "./settings-section";

const FORM_ID = "workspace-form";

export interface WorkspaceFormSheetProps {
  sheet: FormSheetState;
  onCreate: (data: WorkspaceFormData) => Promise<unknown>;
  onUpdate: (id: string, updates: Partial<WorkspaceFormData>) => Promise<unknown>;
}

function toFormState(workspace: CommitteeWorkspace | null): WorkspaceFormValues {
  return {
    name: workspace?.name ?? "",
    description: workspace?.description ?? "",
    type: workspace?.type ?? "general",
    settings: {
      isPublic: workspace?.settings.isPublic ?? false,
      allowGuestAccess: workspace?.settings.allowGuestAccess ?? false,
      requireApproval: workspace?.settings.requireApproval ?? true,
      enableNotifications: workspace?.settings.enableNotifications ?? true,
      autoArchiveDays: workspace?.settings.autoArchiveDays ?? 365,
      maxFileSize: workspace?.settings.maxFileSize ?? 50,
      allowedFileTypes: workspace?.settings.allowedFileTypes ?? [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
      ],
      memberPermissions: workspace?.settings.memberPermissions ?? [
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
        { role: "member", permissions: ["view", "download"] },
      ],
    },
  };
}

/**
 * URL-driven create/edit sheet for committee workspaces (CODING_STANDARD
 * "Dashboard forms"). Opens on ?form=new / ?form=<id>; one form serves both
 * modes. Success/error toasts and query invalidation live in
 * useWorkspaceMutations.
 */
export function WorkspaceFormSheet({ sheet, onCreate, onUpdate }: WorkspaceFormSheetProps) {
  const { data: allWorkspaces = [] } = useFilteredWorkspaces(DEFAULT_FILTERS);
  const editingWorkspace =
    sheet.mode === "edit" ? (allWorkspaces.find((item) => item.id === sheet.editId) ?? null) : null;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target changes; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    form.reset(toFormState(editingWorkspace));
    setSubmitError(null);
  }, [sheet.mode, sheet.editId, editingWorkspace, form]);

  const onSubmit = async (values: WorkspaceFormValues) => {
    setSubmitError(null);
    try {
      if (editingWorkspace) {
        await onUpdate(editingWorkspace.id, values);
      } else {
        await onCreate(values);
      }
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the workspace.";
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
      title={isEdit ? "Edit workspace" : "Create workspace"}
      description={
        isEdit
          ? "Update workspace information and settings."
          : "Create a new collaborative workspace for your committee."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        editingWorkspace || !isEdit ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Workspace"
          />
        ) : undefined
      }
    >
      {isEdit && !editingWorkspace ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This workspace no longer exists. Close the sheet and refresh the list.
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
            <FormSection title="Workspace settings">
              <SettingsSection />
            </FormSection>
            <FormSection title="Member permissions">
              <PermissionsSection />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
