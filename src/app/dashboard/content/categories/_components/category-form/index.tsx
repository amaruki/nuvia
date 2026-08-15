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
import { useCategoriesQuery } from "@/lib/hooks/use-categories/use-categories-query";
import { categoryFormSchema } from "@/lib/validation/content.validation";
import { CATEGORY_COLORS, type Category, type CategoryFormData } from "@/types/category.types";

import { AccessControlSection } from "./access-control-section";
import { BasicInfoSection } from "./basic-info-section";
import { ScopeOrderSection } from "./scope-order-section";
import { TypeStatusSection } from "./type-status-section";
import { VisualSettingsSection } from "./visual-settings-section";

const FORM_ID = "category-form";

export interface CategoryFormSheetProps {
  sheet: FormSheetState;
  onCreate: (data: CategoryFormData) => Promise<Category>;
  onUpdate: (id: string, data: CategoryFormData) => Promise<void>;
  /** Called after a successful save so page-owned views stay in sync. */
  onSaved?: () => void;
}

function toFormState(category: Category | null): CategoryFormData {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    type: category?.type ?? "event",
    status: category?.status ?? "active",
    scope: category?.scope ?? "global",
    color: category?.color ?? CATEGORY_COLORS[0]?.value ?? "#3b82f6",
    icon: category?.icon ?? "",
    emoji: category?.emoji ?? "",
    parentId: category?.parentId ?? "",
    order: category?.order ?? 0,
    allowedRoles: category?.allowedRoles ?? [],
    allowedChapters: category?.allowedChapters ?? [],
    allowedCommittees: category?.allowedCommittees ?? [],
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * URL-driven create/edit sheet for content categories (CODING_STANDARD
 * "Dashboard forms" pilot). The sheet opens on ?form=new / ?form=<id> and
 * shares one form component for both modes.
 */
export function CategoryFormSheet({ sheet, onCreate, onUpdate, onSaved }: CategoryFormSheetProps) {
  const { data: allCategories = [] } = useCategoriesQuery();
  const editingCategory =
    sheet.mode === "edit" ? (allCategories.find((item) => item.id === sheet.editId) ?? null) : null;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [useEmoji, setUseEmoji] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target changes; defaultValues alone would keep stale input across
  // open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    const defaults = toFormState(editingCategory);
    form.reset(defaults);
    setSubmitError(null);
    setSelectedColor(defaults.color);
    setUseEmoji(Boolean(defaults.emoji));
  }, [sheet.mode, sheet.editId, editingCategory, form]);

  const onSubmit = async (values: CategoryFormData) => {
    setSubmitError(null);
    try {
      const payload = { ...values, slug: values.slug?.trim() || slugify(values.name) };
      if (editingCategory) {
        await onUpdate(editingCategory.id, payload);
        toast.success("Category updated");
      } else {
        await onCreate(payload);
        toast.success("Category created");
      }
      onSaved?.();
      sheet.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save the category.";
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
      title={isEdit ? "Edit category" : "Create category"}
      description={
        isEdit
          ? "Update the category details below."
          : "Categories group content so members can find what matters to them."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        editingCategory || !isEdit ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Category"
          />
        ) : undefined
      }
    >
      {isEdit && !editingCategory ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This category no longer exists. Close the sheet and refresh the list.
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
              <BasicInfoSection />
            </FormSection>
            <FormSection title="Type and status">
              <TypeStatusSection form={form} />
            </FormSection>
            <FormSection title="Scope and order">
              <ScopeOrderSection form={form} watchedScope={form.watch("scope")} />
            </FormSection>
            <FormSection title="Visual appearance">
              <VisualSettingsSection
                form={form}
                selectedColor={selectedColor}
                useEmoji={useEmoji}
                onColorSelect={(color) => {
                  setSelectedColor(color);
                  form.setValue("color", color, { shouldDirty: true });
                }}
                onToggleEmojiMode={() => setUseEmoji((previous) => !previous)}
              />
            </FormSection>
            <FormSection
              title="Access control"
              description="Restrict which chapters or committees can use this category."
            >
              <AccessControlSection watchedScope={form.watch("scope")} />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
