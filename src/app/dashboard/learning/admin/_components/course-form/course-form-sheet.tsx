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
import { Skeleton } from "@/components/ui/skeleton";
import { useCourse, useCourseMutations } from "@/lib/hooks/use-learning-courses";
import {
  courseFormSchema,
  type CourseFormInput,
  type CourseFormValues,
} from "@/lib/validation/learning.validation";
import type { Course } from "@/types/learning.types";

import { BasicInfoSection } from "./basic-info-section";
import { CurriculumSection } from "./curriculum-section";

const FORM_ID = "course-form";

const EMPTY_FORM_VALUES: CourseFormValues = {
  title: "",
  description: "",
  category: "",
  level: "Beginner",
  image: "",
  price: 0,
  modules: [],
};

/** Maps a fetched course onto the form shape (edit-mode seed values). */
function toFormValues(course: Course): CourseFormValues {
  return {
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    image: course.image,
    price: course.price || 0,
    modules:
      course.modules?.map((module) => ({
        id: module.id,
        title: module.title,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          type: lesson.type,
          isCompleted: lesson.isCompleted,
        })),
      })) ?? [],
  };
}

export interface CourseFormSheetProps {
  sheet: FormSheetState;
}

/**
 * URL-driven create/edit sheet for learning courses (CODING_STANDARD
 * "Dashboard forms"). The sheet opens on ?form=new / ?form=<courseId> and
 * shares one form for both modes. Edit mode loads the course through the
 * existing useCourse query before seeding the form; the create/update
 * mutations toast and invalidate the shared ["learning", "courses"] keys.
 */
export function CourseFormSheet({ sheet }: CourseFormSheetProps) {
  const { createCourse, updateCourse } = useCourseMutations();
  const {
    data: course,
    isPending,
    isError,
  } = useCourse(sheet.mode === "edit" ? (sheet.editId ?? undefined) : undefined);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CourseFormInput, unknown, CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  const isEdit = sheet.mode === "edit";
  const isReady = !isEdit || Boolean(course);

  // Seed (or re-seed) the form every time the sheet opens or the edit
  // target changes; defaultValues alone would keep stale input across
  // open/close cycles. Edit mode waits for the course query to settle.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    if (sheet.mode === "edit" && !course) return;
    form.reset(sheet.mode === "edit" && course ? toFormValues(course) : EMPTY_FORM_VALUES);
    setSubmitError(null);
  }, [sheet.mode, sheet.editId, course, form]);

  const onSubmit = async (values: CourseFormValues) => {
    setSubmitError(null);
    try {
      if (isEdit && course) {
        await updateCourse(course.id, values);
      } else {
        await createCourse(values);
      }
      sheet.close();
    } catch (error) {
      // The mutation already toasted the failure; the inline alert keeps
      // the reason visible inside the sheet.
      setSubmitError(error instanceof Error ? error.message : "Failed to save the course.");
    }
  };

  const { isDirty, isSubmitting } = form.formState;

  return (
    <FormSheet
      open={sheet.mode !== "closed"}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit course" : "Create course"}
      description={
        isEdit ? "Update course details and curriculum." : "Add a new course to your catalog."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        isReady ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Course"
          />
        ) : undefined
      }
    >
      {isEdit && !isReady && isPending ? (
        <div className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <span className="sr-only">Loading course…</span>
        </div>
      ) : isEdit && !course ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This course no longer exists or could not be loaded. Close the sheet and refresh the
              list.
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

            <FormSection title="Basic information" description="General details about your course.">
              <BasicInfoSection />
            </FormSection>

            <FormSection
              title="Curriculum"
              description="Organize your course into modules and lessons."
            >
              <CurriculumSection form={form} />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
