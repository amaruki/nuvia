"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import  PublicationPageForm from "@/components/content/add-publication-form";
import { usePublications } from "@/lib/hooks/use-publications";
import { useHeader } from "@/contexts/dashboard-context";
import { Publication } from "@/types/publication.types";

export default function EditPublicationPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getPublication, updatePublication } = usePublications();

  // Query for publication data
  const { data: publication, isLoading, error: queryError } = useQuery({
    queryKey: ['publication', params.id],
    queryFn: async () => {
      // Get the publication ID from params
      const id = params.id as string;
      
      // Simulate API call - in real app this would be fetch('/api/publications/${id}')
      // For now, we'll use a simple timeout to simulate async behavior
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        title: `Edit: ${publication.title}`,
        description: `Edit ${publication.type} publication details and content`,
      });
    }

    return () => {
      clearHeader();
    };
  }, [publication, setHeader, clearHeader]);

  const handleFormSubmit = async (data: any) => {
    try {
      await updatePublication(params.id as string, data);
      router.push(`/dashboard/content/publications/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update publication");
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/content/publications/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (queryError || !publication) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error || queryError?.message || "Publication not found"}</p>
        </div>
      </div>
    );
  }

  return (
      <PublicationPageForm
        onSubmit={handleFormSubmit}
        initialData={{
          title: publication.title,
          slug: publication.slug,
          excerpt: publication.excerpt,
          content: publication.content,
          type: publication.type,
          category: publication.category,
          status: publication.status,
          authorId: publication.author.id,
          coAuthorIds: publication.coAuthors?.map(author => author.id),
          tagIds: publication.tags.map(tag => tag.id),
          featuredImage: publication.featuredImage,
          gallery: publication.gallery,
          difficulty: publication.difficulty,
          visibility: publication.visibility,
          commentsEnabled: publication.commentsEnabled,
          sharingEnabled: publication.sharingEnabled,
          downloadEnabled: publication.downloadEnabled,
          isFeatured: publication.isFeatured,
          isPinned: publication.isPinned,
          priority: publication.priority,
          seo: publication.seo,
        }}
        isEditing={true}
      />
  );
}