"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { ArticleRow } from "./article-row";
import type { ArticlesTableProps } from "./types";

export function ArticlesTable({
  articles,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  selectedArticles = [],
  onSelectionChange,
}: ArticlesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? articles.map((a) => a.id) : []);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedArticles, id]
        : selectedArticles.filter((selectedId) => selectedId !== id);
      onSelectionChange(newSelection);
    }
  };

  const isAllSelected = articles.length > 0 && selectedArticles.length === articles.length;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all articles"
                />
              </TableHead>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px]">Author</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="w-[100px]">Difficulty</TableHead>
              <TableHead className="w-[100px]">Published</TableHead>
              <TableHead className="w-[80px] text-right">Views</TableHead>
              <TableHead className="w-[100px] text-right">Engagement</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                isSelected={selectedArticles.includes(article.id)}
                isExpanded={expandedRows.has(article.id)}
                onToggleExpansion={toggleRowExpansion}
                onSelect={handleSelectRow}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onPublish={onPublish}
                onArchive={onArchive}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-2">No articles found</h3>
          <p className="text-sm">
            Try adjusting your filters or create a new article to get started.
          </p>
        </div>
      )}
    </div>
  );
}
