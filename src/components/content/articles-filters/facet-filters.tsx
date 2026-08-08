"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ArticleAuthor, ArticleTag } from "@/types/article.types";
import type { FiltersControlProps } from "./types";

export interface FacetFiltersProps extends FiltersControlProps {
  authors: ArticleAuthor[];
  tags: ArticleTag[];
}

export function FacetFilters({ filters, onFiltersChange, authors, tags }: FacetFiltersProps) {
  const handleAuthorChange = (authorId: string, checked: boolean) => {
    const currentAuthors = filters.author || [];
    const newAuthors = checked
      ? [...currentAuthors, authorId]
      : currentAuthors.filter((a) => a !== authorId);
    onFiltersChange({ author: newAuthors });
  };

  const handleTagChange = (tagId: string, checked: boolean) => {
    const currentTags = filters.tags || [];
    const newTags = checked ? [...currentTags, tagId] : currentTags.filter((t) => t !== tagId);
    onFiltersChange({ tags: newTags });
  };

  return (
    <>
      {/* Author Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Authors</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {authors.map((author) => (
            <div key={author.id} className="flex items-center space-x-2">
              <Checkbox
                id={`author-${author.id}`}
                checked={filters.author?.includes(author.id) || false}
                onCheckedChange={(checked: boolean) => handleAuthorChange(author.id, checked)}
              />
              <Label htmlFor={`author-${author.id}`} className="text-sm font-normal cursor-pointer">
                {author.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tags</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={filters.tags?.includes(tag.id) || false}
                onCheckedChange={(checked: boolean) => handleTagChange(tag.id, checked)}
              />
              <Label
                htmlFor={`tag-${tag.id}`}
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
