"use client";

import { Button } from "@/components/ui/button";
import { PublicationsTable } from "@/components/content/publications-table";
import type { Publication, PublicationFilters } from "@/types/publication";

interface PublicationsTabProps {
  publications: Publication[];
  selectedPublications: string[];
  onSelectionChange: (ids: string[]) => void;
  currentPage: number;
  totalPages: number;
  updateFilters: (filters: Partial<PublicationFilters>) => void;
  onViewDetails: (publication: Publication) => void;
  onEdit: (publication: Publication) => void;
  onDelete: (publication: Publication) => void;
  onDuplicate: (publication: Publication) => void;
  onPublish: (publication: Publication) => void;
  onArchive: (publication: Publication) => void;
  onSchedule: (publication: Publication, date: Date) => void;
}

export function PublicationsTab({
  publications,
  selectedPublications,
  onSelectionChange,
  currentPage,
  totalPages,
  updateFilters,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  onSchedule,
}: PublicationsTabProps) {
  return (
    <>
      <PublicationsTable
        publications={publications}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onPublish={onPublish}
        onArchive={onArchive}
        onSchedule={onSchedule}
        selectedPublications={selectedPublications}
        onSelectionChange={onSelectionChange}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1) })}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
