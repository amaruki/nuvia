"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { usePublications } from "@/lib/hooks/use-publications";
import { useHeader } from "@/contexts/dashboard-context";
import { PublicationContentSection } from "./_components/publication-content-section";
import { PublicationHeader } from "./_components/publication-header";
import { PublicationHeaderActions } from "./_components/publication-header-actions";
import { PublicationMetricsCard } from "./_components/publication-metrics-card";
import { PublicationSeoCard } from "./_components/publication-seo-card";
import { PublicationError, PublicationLoading } from "./_components/publication-states";

export default function PublicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { getPublication, deletePublication, publishPublication, archivePublication } =
    usePublications();

  // Query for publication data
  const {
    data: publication,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["publication", params.id],
    queryFn: async () => {
      // Get the publication ID from params
      const id = params.id as string;

      // Simulate API call - in real app this would be fetch('/api/publications/${id}')
      // For now, we'll use a simple timeout to simulate async behavior
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 500);
      await promise;

      // Get publication from the hook (this is already available in the component)
      const pub = getPublication(id);
      if (!pub) {
        throw new Error("Publication not found");
      }
      return pub;
    },
    enabled: !!params.id,
  });

  // Update header when publication data is available
  useEffect(() => {
    if (publication) {
      setHeader({
        title: publication.title,
        description: `View and manage ${publication.type} publication details`,
      });
    }

    return () => {
      clearHeader();
    };
  }, [publication, setHeader, clearHeader]);

  const handleEdit = () => {
    router.push(`/dashboard/content/publications/edit/${params.id}`);
  };

  const handleDelete = async () => {
    if (!publication) return;

    if (
      confirm(
        `Are you sure you want to delete "${publication.title}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deletePublication(publication.id);
        router.push("/dashboard/content/publications");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete publication");
      }
    }
  };

  const handlePublish = async () => {
    if (!publication) return;

    try {
      await publishPublication(publication.id);
      // Invalidate and refetch query to get updated data
      queryClient.invalidateQueries({ queryKey: ["publication", params.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish publication");
    }
  };

  const handleArchive = async () => {
    if (!publication) return;

    try {
      await archivePublication(publication.id);
      // Invalidate and refetch query to get updated data
      queryClient.invalidateQueries({ queryKey: ["publication", params.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive publication");
    }
  };

  if (isLoading) {
    return <PublicationLoading />;
  }

  if (queryError || !publication) {
    return (
      <PublicationError
        error={error || queryError?.message || "Publication not found"}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <PublicationHeaderActions
        publication={publication}
        onBack={() => router.back()}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      {/* Publication Header */}
      <PublicationHeader publication={publication} />

      <Separator />

      {/* Featured Image, Content, Gallery */}
      <PublicationContentSection publication={publication} />

      {/* Metrics */}
      <PublicationMetricsCard metrics={publication.metrics} />

      {/* SEO Information */}
      <PublicationSeoCard publication={publication} />
    </div>
  );
}
