"use client";

import { ArticlesTable } from "@/components/content/articles-table";
import { Button } from "@/components/ui/button";
import type { Article, ArticleFilters } from "@/types/article.types";

interface ArticlesTabProps {
  articles: Article[];
  onViewDetails: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onDuplicate: (article: Article) => void;
  onPublish: (article: Article) => void;
  onArchive: (article: Article) => void;
  onSchedule: (article: Article, date: Date) => void;
  selectedArticles: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  currentPage: number;
  totalPages: number;
  updateFilters: (filters: Partial<ArticleFilters>) => void;
}

export function ArticlesTab({
  articles,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  onSchedule,
  selectedArticles,
  onSelectionChange,
  currentPage,
  totalPages,
  updateFilters,
}: ArticlesTabProps) {
  return (
    <>
      <ArticlesTable
        articles={articles}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onPublish={onPublish}
        onArchive={onArchive}
        onSchedule={onSchedule}
        selectedArticles={selectedArticles}
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
