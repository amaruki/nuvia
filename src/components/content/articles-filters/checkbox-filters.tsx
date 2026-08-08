"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ARTICLE_TYPES,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES,
  ARTICLE_DIFFICULTIES,
  ARTICLE_FORMATS,
  type ArticleStatus,
  type ArticleType,
  type ArticleCategory,
  type ArticleDifficulty,
  type ArticleFormat,
} from "@/types/article.types";
import type { FiltersControlProps } from "./types";

export function CheckboxFilters({ filters, onFiltersChange }: FiltersControlProps) {
  const handleStatusChange = (status: ArticleStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);
    onFiltersChange({ status: newStatuses });
  };

  const handleTypeChange = (type: ArticleType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);
    onFiltersChange({ type: newTypes });
  };

  const handleCategoryChange = (category: ArticleCategory, checked: boolean) => {
    const currentCategories = filters.category || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter((c) => c !== category);
    onFiltersChange({ category: newCategories });
  };

  const handleDifficultyChange = (difficulty: ArticleDifficulty, checked: boolean) => {
    const currentDifficulties = filters.difficulty || [];
    const newDifficulties = checked
      ? [...currentDifficulties, difficulty]
      : currentDifficulties.filter((d) => d !== difficulty);
    onFiltersChange({ difficulty: newDifficulties });
  };

  const handleFormatChange = (format: ArticleFormat, checked: boolean) => {
    const currentFormats = filters.format || [];
    const newFormats = checked
      ? [...currentFormats, format]
      : currentFormats.filter((f) => f !== format);
    onFiltersChange({ format: newFormats });
  };

  return (
    <>
      {/* Status Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {ARTICLE_STATUSES.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.status?.includes(status) || false}
                onCheckedChange={(checked: boolean) => handleStatusChange(status, checked)}
              />
              <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer">
                {status.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Type</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {ARTICLE_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.type?.includes(type) || false}
                onCheckedChange={(checked: boolean) => handleTypeChange(type, checked)}
              />
              <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">
                {type.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {ARTICLE_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.category?.includes(category) || false}
                onCheckedChange={(checked: boolean) => handleCategoryChange(category, checked)}
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Difficulty</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {ARTICLE_DIFFICULTIES.map((difficulty) => (
            <div key={difficulty} className="flex items-center space-x-2">
              <Checkbox
                id={`difficulty-${difficulty}`}
                checked={filters.difficulty?.includes(difficulty) || false}
                onCheckedChange={(checked: boolean) => handleDifficultyChange(difficulty, checked)}
              />
              <Label
                htmlFor={`difficulty-${difficulty}`}
                className="text-sm font-normal cursor-pointer"
              >
                {difficulty.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Format Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Format</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {ARTICLE_FORMATS.map((format) => (
            <div key={format} className="flex items-center space-x-2">
              <Checkbox
                id={`format-${format}`}
                checked={filters.format?.includes(format) || false}
                onCheckedChange={(checked: boolean) => handleFormatChange(format, checked)}
              />
              <Label htmlFor={`format-${format}`} className="text-sm font-normal cursor-pointer">
                {format.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
