"use client";

/**
 * D3: learning courses dashboard hooks backed by the real learning API.
 *
 * react-query over `apiFetch` (same arrangement as use-committees/):
 * the list query hydrates wire dates via `toCourseUi`, statistics are
 * computed client-side from the fetched page (never invented), and
 * mutations invalidate the shared `["learning", "courses"]` key.
 */

import { useMemo } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { Course } from "@/types/learning.types";
import type { CreateCourseInput, UpdateCourseInput } from "@/lib/services/learning";

// ---------------------------------------------------------------------------
// Wire → UI mapping (ISO date strings → display labels)
// ---------------------------------------------------------------------------

/** Wire shape returned by /api/v1/learning/courses: Course with an ISO `updatedAt`. */
export type WireCourse = Course;

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

/** Hydrates the wire ISO `updatedAt` into the "Updated …" label the pages render. */
export function toCourseUi(wire: WireCourse): Course {
  const hydrated: Course = { ...wire };
  if (wire.updatedAt) {
    const parsed = new Date(wire.updatedAt);
    hydrated.updatedAt = Number.isNaN(parsed.getTime()) ? undefined : MONTH_YEAR.format(parsed);
  }
  return hydrated;
}

// ---------------------------------------------------------------------------
// Form payload (admin create/edit form → API)
// ---------------------------------------------------------------------------

// The write boundary reuses the service's zod-inferred input types
// (`CreateCourseInput` / `UpdateCourseInput`) so the form and admin pages
// submit exactly what the API validates — no parallel shape to drift.

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useLearningCourses() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["learning", "courses", "list"],
    queryFn: async () => {
      const { data } = await apiFetch<WireCourse[]>("/api/v1/learning/courses?limit=100");
      return data.map(toCourseUi);
    },
  });

  const invalidateCourses = () =>
    queryClient.invalidateQueries({ queryKey: ["learning", "courses"] });

  const createMutation = useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const { data } = await apiFetch<WireCourse>("/api/v1/learning/courses", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return toCourseUi(data);
    },
    onSuccess: () => {
      toast.success("Course created");
      invalidateCourses();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to create course");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCourseInput }) => {
      const { data } = await apiFetch<WireCourse>(`/api/v1/learning/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return toCourseUi(data);
    },
    onSuccess: () => {
      toast.success("Course updated");
      invalidateCourses();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update course");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/v1/learning/courses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Course deleted");
      invalidateCourses();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to delete course");
    },
  });

  const courses = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const createCourse = async (input: CreateCourseInput) => {
    await createMutation.mutateAsync(input);
  };

  const updateCourse = async (id: string, updates: UpdateCourseInput) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteCourse = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    courses,
    loading: listQuery.isPending,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch courses. Please try again."
      : null,
    createCourse,
    updateCourse,
    deleteCourse,
    refreshData: invalidateCourses,
  };
}

/** Single-course query for the detail and admin edit pages. */
export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ["learning", "courses", "detail", id],
    queryFn: async () => {
      const { data } = await apiFetch<WireCourse>(`/api/v1/learning/courses/${id}`);
      return toCourseUi(data);
    },
    enabled: Boolean(id),
  });
}

/** Query for the server-paginated admin list (search/category/level are server-side). */
export interface LearningCoursesPageQuery {
  search?: string;
  category?: string;
  level?: string;
  page: number;
  limit: number;
}

export interface LearningCoursesPage {
  courses: Course[];
  total: number;
  totalPages: number;
  page: number;
}

/** Server-paginated course list for the DataTable admin surface. */
export function useLearningCoursesPage({
  search,
  category,
  level,
  page,
  limit,
}: LearningCoursesPageQuery) {
  return useQuery({
    queryKey: [
      "learning",
      "courses",
      "page",
      { search: search ?? "", category: category ?? "", level: level ?? "", page, limit },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (level) params.set("level", level);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const { data, meta } = await apiFetch<WireCourse[]>(
        `/api/v1/learning/courses?${params.toString()}`,
      );
      return {
        courses: data.map(toCourseUi),
        total: meta?.total ?? data.length,
        totalPages: meta?.totalPages ?? 1,
        page: meta?.page ?? page,
      } satisfies LearningCoursesPage;
    },
    placeholderData: keepPreviousData,
  });
}

/** Standalone delete mutation for surfaces that paginate (e.g. the admin DataTable). */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/v1/learning/courses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["learning", "courses"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to delete course");
    },
  });
}
