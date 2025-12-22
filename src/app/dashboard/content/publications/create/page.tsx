"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import PublicationPageForm from "@/components/content/add-publication-form";
import { usePublications } from "@/lib/hooks/use-publications";
import { useHeader } from "@/contexts/dashboard-context";

export default function CreatePublicationPage() {
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addPublication } = usePublications();

  useEffect(() => {
    setHeader({
      title: "Create New Publication",
      description:
        "Create a new publication with comprehensive metadata and content management",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleFormSubmit = async (data: any) => {
    try {
      const newPublication = await addPublication(data);
      router.push(`/dashboard/content/publications/${newPublication.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create publication"
      );
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/content/publications");
  };

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Create Form */}
      <PublicationPageForm onSubmit={handleFormSubmit} isEditing={false} />
    </>
  );
}
