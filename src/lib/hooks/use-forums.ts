"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ForumCategory,
  ForumCategoryApi,
  ForumCategoryInput,
  ForumPost,
  Report,
} from "@/types/forum.types";
import type { UserRole } from "@/types/dashboard.types";

const FORUMS_API = "/api/v1/forums";

/** Unwraps the success envelope; throws Error(detail) on Problem responses. */
async function forumFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${FORUMS_API}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const problem = (await response.json()) as { detail?: string; title?: string };
      detail = problem.detail ?? problem.title ?? detail;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new Error(detail);
  }

  const body = (await response.json()) as { data: T };
  return body.data;
}

/** API category row -> UI shape (form "Name" maps to displayName). */
function toUiCategory(row: ForumCategoryApi): ForumCategory {
  return {
    id: row.id,
    name: row.displayName,
    description: row.description ?? "",
    icon: row.icon ?? "MessageSquare",
    color: row.color ?? "#6b7280",
    postCount: row.postCount,
    ...(row.lastPostAt ? { lastPostAt: row.lastPostAt } : {}),
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function useForumCategories() {
  return useQuery({
    queryKey: ["forums", "categories"],
    queryFn: async () => {
      const rows = await forumFetch<ForumCategoryApi[]>("/categories");
      return rows.map(toUiCategory);
    },
  });
}

export function useCreateForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ForumCategoryInput) =>
      forumFetch<ForumCategoryApi>("/categories", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forums", "categories"] });
    },
  });
}

export function useUpdateForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ForumCategoryInput> }) =>
      forumFetch<ForumCategoryApi>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forums", "categories"] });
    },
  });
}

export function useDeleteForumCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      forumFetch<{ id: string; deleted: boolean }>(`/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forums", "categories"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Moderation queue
// ---------------------------------------------------------------------------

export function useModerationQueue() {
  return useQuery({
    queryKey: ["forums", "moderation", "queue"],
    queryFn: async () => {
      const rows = await forumFetch<ForumPost[]>("/moderation/queue");
      // Role comes off a free-text DB column; narrow for the UI type.
      return rows.map((post) => ({
        ...post,
        author: { ...post.author, role: post.author.role as UserRole },
      }));
    },
  });
}

export function useModeratePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      action,
      reason,
    }: {
      postId: string;
      action: "approve" | "reject" | "hide";
      reason?: string;
    }) =>
      forumFetch(`/moderation/posts/${postId}`, {
        method: "POST",
        body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forums", "moderation"] });
      void queryClient.invalidateQueries({ queryKey: ["forums", "posts"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function useForumReports() {
  return useQuery({
    queryKey: ["forums", "reports"],
    queryFn: () => forumFetch<Report[]>("/reports"),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      deleteContent,
    }: {
      id: string;
      action: "RESOLVED" | "DISMISSED";
      deleteContent?: boolean;
    }) =>
      forumFetch<Report>(`/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          ...(deleteContent !== undefined ? { deleteContent } : {}),
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forums", "reports"] });
      void queryClient.invalidateQueries({ queryKey: ["forums", "moderation"] });
    },
  });
}
