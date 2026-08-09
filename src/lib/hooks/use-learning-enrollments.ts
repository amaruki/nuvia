"use client";

/**
 * Learning enrollment hooks (backlog UI-35) backed by the real learning API.
 *
 * react-query over `apiFetch` (same arrangement as use-learning-courses):
 * the list query returns the caller's own active enrollments joined with
 * their course, mutations hit the enrollments endpoints, and every mutation
 * invalidates the shared ["learning", "enrollments"] key so the catalog,
 * my-courses, and lesson-view stay in sync.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { EnrolledCourse, Enrollment } from "@/types/learning.types";

const ENROLLMENTS_KEY = ["learning", "enrollments"];

export function useMyEnrollments() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ENROLLMENTS_KEY,
    queryFn: async () => (await apiFetch<EnrolledCourse[]>("/api/v1/learning/enrollments")).data,
  });

  const invalidateEnrollments = () => queryClient.invalidateQueries({ queryKey: ENROLLMENTS_KEY });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await apiFetch<Enrollment>("/api/v1/learning/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Enrolled — find the course under My Courses");
      invalidateEnrollments();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to enroll");
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await apiFetch(`/api/v1/learning/enrollments/${courseId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Enrollment canceled");
      invalidateEnrollments();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to unenroll");
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ courseId, progress }: { courseId: string; progress: number }) => {
      const { data } = await apiFetch<Enrollment>(`/api/v1/learning/enrollments/${courseId}`, {
        method: "PATCH",
        body: JSON.stringify({ progress }),
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Progress saved");
      invalidateEnrollments();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to save progress");
    },
  });

  return {
    enrolledCourses: listQuery.data ?? [],
    loading: listQuery.isPending,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch enrollments. Please try again."
      : null,
    /** Idempotent on the server: an active enrollment is returned unchanged. */
    enroll: (courseId: string) => enrollMutation.mutateAsync(courseId),
    enrolling: enrollMutation.isPending,
    unenroll: (courseId: string) => unenrollMutation.mutateAsync(courseId),
    unenrolling: unenrollMutation.isPending,
    updateProgress: (courseId: string, progress: number) =>
      updateProgressMutation.mutateAsync({ courseId, progress }),
    updatingProgress: updateProgressMutation.isPending,
  };
}
