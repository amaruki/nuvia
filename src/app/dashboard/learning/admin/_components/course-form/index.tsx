"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { useLearningCourses } from "@/lib/hooks/use-learning-courses";

import { BasicInfoSection } from "./basic-info-section";
import { CurriculumSection } from "./curriculum-section";
import { courseFormSchema } from "./schema";
import type { CourseFormInput, CourseFormValues } from "./schema";
import type { CourseFormProps } from "./types";

export function CourseForm({ initialData }: CourseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const { createCourse, updateCourse } = useLearningCourses();

  const onSubmit = async (data: CourseFormValues) => {
    setIsLoading(true);
    try {
      if (initialData?.id) {
        await updateCourse(initialData.id, data);
      } else {
        await createCourse(data);
      }
      router.push("/dashboard/learning/admin");
      router.refresh();
    } catch {
      // Hook already surfaced the error via toast.
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<CourseFormInput, unknown, CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          category: initialData.category,
          level: initialData.level,
          image: initialData.image,
          price: initialData.price || 0,
          modules:
            initialData.modules?.map((m) => ({
              id: m.id,
              title: m.title,
              lessons: m.lessons.map((l) => ({
                id: l.id,
                title: l.title,
                duration: l.duration,
                type: l.type,
                isCompleted: l.isCompleted,
              })),
            })) || [],
        }
      : {
          title: "",
          description: "",
          category: "",
          level: "Beginner",
          image: "",
          price: 0,
          modules: [],
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-fadeInUp">
        <div className="grid gap-8">
          <BasicInfoSection form={form} />

          <CurriculumSection form={form} />

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Course"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
