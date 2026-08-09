"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CommitteeFormData } from "@/types/committee";

import { apiFetch, ApiClientError } from "@/lib/api-client";

import { COMMITTEES_API_PATH } from "./constants";
import { toCommitteeUi } from "./hydrate-committee";
import type { WireCommittee } from "./types";

interface UseCommitteeMutationsDeps {
  invalidate: () => Promise<void>;
}

export function useCommitteeMutations({ invalidate }: UseCommitteeMutationsDeps) {
  const createMutation = useMutation({
    mutationFn: async (input: CommitteeFormData) => {
      const { data } = await apiFetch<WireCommittee>(COMMITTEES_API_PATH, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return toCommitteeUi(data);
    },
    onSuccess: () => {
      toast.success("Committee created");
      invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to create committee");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CommitteeFormData> }) => {
      const { data } = await apiFetch<WireCommittee>(`${COMMITTEES_API_PATH}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return toCommitteeUi(data);
    },
    onSuccess: () => {
      toast.success("Committee updated");
      invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update committee");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`${COMMITTEES_API_PATH}/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Committee deleted");
      invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to delete committee");
    },
  });

  const addCommittee = async (data: CommitteeFormData) => {
    await createMutation.mutateAsync(data);
  };

  const updateCommittee = async (id: string, updates: Partial<CommitteeFormData>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteCommittee = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const toggleCommitteeStatus = async (id: string, status: "active" | "inactive") => {
    await updateMutation.mutateAsync({ id, updates: { status } });
  };

  return { addCommittee, updateCommittee, deleteCommittee, toggleCommitteeStatus };
}
