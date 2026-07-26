"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Search,
  User,
  Tag,
  FileText,
  Star,
  ChevronDown,
  RotateCcw,
  Timer,
  Zap,
} from "lucide-react";
import {
  ArticleFilters,
  ArticleStatus,
  ArticleType,
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ARTICLE_TYPES,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES,
  ARTICLE_DIFFICULTIES,
  ARTICLE_FORMATS,
} from "@/types/article.types";
import { cn } from "@/lib/utils";
import { mockArticles } from "@/lib/data/mock-article-data";

interface ArticlesFiltersProps {
  filters: ArticleFilters;
  onFiltersChange: (filters: Partial<ArticleFilters>) => void;
  onClearFilters: () => void;
}

export function ArticlesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ArticlesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique authors and tags from mock data
  const mockAuthors = Array.from(new Set(mockArticles.map((a) => a.author.id))).map(
    (id) => mockArticles.find((a) => a.author.id === id)!.author,
  );

  const mockTags = Array.from(new Set(mockArticles.flatMap((a) => a.tags))).map((tag, index) => ({
    ...tag,
    id: tag.id || `tag_${index}`,
  }));

  const hasActiveFilters = !!(
    filters.search ||
    (filters.status && filters.status.length > 0) ||
    (filters.type && filters.type.length > 0) ||
    (filters.category && filters.category.length > 0) ||
    (filters.difficulty && filters.difficulty.length > 0) ||
    (filters.format && filters.format.length > 0) ||
    (filters.author && filters.author.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.dateRange ||
    (filters.visibility && filters.visibility.length > 0) ||
    filters.featured !== undefined ||
    filters.hasSeries !== undefined ||
    filters.minReadTime !== undefined ||
    filters.maxReadTime !== undefined ||
    filters.minEngagement !== undefined ||
    filters.maxEngagement !== undefined
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.type && filters.type.length > 0) count++;
    if (filters.category && filters.category.length > 0) count++;
    if (filters.difficulty && filters.difficulty.length > 0) count++;
    if (filters.format && filters.format.length > 0) count++;
    if (filters.author && filters.author.length > 0) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.dateRange) count++;
    if (filters.visibility && filters.visibility.length > 0) count++;
    if (filters.featured !== undefined) count++;
    if (filters.hasSeries !== undefined) count++;
    if (filters.minReadTime !== undefined) count++;
    if (filters.maxReadTime !== undefined) count++;
    if (filters.minEngagement !== undefined) count++;
    if (filters.maxEngagement !== undefined) count++;
    return count;
  };

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

  const clearDateRange = () => {
    onFiltersChange({ dateRange: undefined });
  };

  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case "search":
        onFiltersChange({ search: "" });
        break;
      case "status":
        onFiltersChange({ status: [] });
        break;
      case "type":
        onFiltersChange({ type: [] });
        break;
      case "category":
        onFiltersChange({ category: [] });
        break;
      case "difficulty":
        onFiltersChange({ difficulty: [] });
        break;
      case "format":
        onFiltersChange({ format: [] });
        break;
      case "author":
        onFiltersChange({ author: [] });
        break;
      case "tags":
        onFiltersChange({ tags: [] });
        break;
      case "dateRange":
        onFiltersChange({ dateRange: undefined });
        break;
      case "visibility":
        onFiltersChange({ visibility: [] });
        break;
      case "featured":
        onFiltersChange({ featured: undefined });
        break;
      case "hasSeries":
        onFiltersChange({ hasSeries: undefined });
        break;
      case "readTime":
        onFiltersChange({ minReadTime: undefined, maxReadTime: undefined });
        break;
      case "engagement":
        onFiltersChange({ minEngagement: undefined, maxEngagement: undefined });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
          <span className="text-sm font-medium">Active Filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <button
                onClick={() => removeFilter("search")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && filters.status.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Status ({filters.status.length})
              <button
                onClick={() => removeFilter("status")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.type && filters.type.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Type ({filters.type.length})
              <button
                onClick={() => removeFilter("type")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.category && filters.category.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Category ({filters.category.length})
              <button
                onClick={() => removeFilter("category")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.difficulty && filters.difficulty.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Difficulty ({filters.difficulty.length})
              <button
                onClick={() => removeFilter("difficulty")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.format && filters.format.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Format ({filters.format.length})
              <button
                onClick={() => removeFilter("format")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.author && filters.author.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Authors ({filters.author.length})
              <button
                onClick={() => removeFilter("author")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.tags && filters.tags.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Tags ({filters.tags.length})
              <button
                onClick={() => removeFilter("tags")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              Date Range
              <button
                onClick={() => removeFilter("dateRange")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.visibility && filters.visibility.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Visibility ({filters.visibility.length})
              <button
                onClick={() => removeFilter("visibility")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.featured !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Featured: {filters.featured ? "Yes" : "No"}
              <button
                onClick={() => removeFilter("featured")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.hasSeries !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Series: {filters.hasSeries ? "Yes" : "No"}
              <button
                onClick={() => removeFilter("hasSeries")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.minReadTime !== undefined || filters.maxReadTime !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              Read Time
              <button
                onClick={() => removeFilter("readTime")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.minEngagement !== undefined || filters.maxEngagement !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              Engagement
              <button
                onClick={() => removeFilter("engagement")}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      )}

      {/* Filters Panel */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
            <ChevronDown
              className={cn("ml-2 h-4 w-4 transition-transform", isExpanded && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-6 mt-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search articles..."
                value={filters.search || ""}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    <Label
                      htmlFor={`status-${status}`}
                      className="text-sm font-normal cursor-pointer"
                    >
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
                      onCheckedChange={(checked: boolean) =>
                        handleCategoryChange(category, checked)
                      }
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
                      onCheckedChange={(checked: boolean) =>
                        handleDifficultyChange(difficulty, checked)
                      }
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
                    <Label
                      htmlFor={`format-${format}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {format.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Author Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Authors</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockAuthors.map((author) => (
                  <div key={author.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`author-${author.id}`}
                      checked={filters.author?.includes(author.id) || false}
                      onCheckedChange={(checked: boolean) => handleAuthorChange(author.id, checked)}
                    />
                    <Label
                      htmlFor={`author-${author.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
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
                {mockTags.map((tag) => (
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
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange
                      ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
                      : "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={
                      filters.dateRange
                        ? { from: filters.dateRange.start, to: filters.dateRange.end }
                        : undefined
                    }
                    onSelect={(range) =>
                      onFiltersChange({
                        dateRange:
                          range && range.from && range.to
                            ? { start: range.from, end: range.to }
                            : undefined,
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
              {filters.dateRange && (
                <Button variant="ghost" size="sm" onClick={clearDateRange} className="mt-2 w-full">
                  <X className="mr-2 h-4 w-4" />
                  Clear Date Range
                </Button>
              )}
            </div>

            {/* Visibility Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Visibility</Label>
              <Select
                value={filters.visibility?.[0] || ""}
                onValueChange={(value) => onFiltersChange({ visibility: value ? [value] : [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members_only">Members Only</SelectItem>
                  <SelectItem value="premium_only">Premium Only</SelectItem>
                  <SelectItem value="chapter_only">Chapter Only</SelectItem>
                  <SelectItem value="committee_only">Committee Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Featured</Label>
              <Select
                value={filters.featured === undefined ? "" : filters.featured.toString()}
                onValueChange={(value) =>
                  onFiltersChange({
                    featured: value === "" ? undefined : value === "true",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Featured Only</SelectItem>
                  <SelectItem value="false">Not Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Has Series Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Series</Label>
              <Select
                value={filters.hasSeries === undefined ? "" : filters.hasSeries.toString()}
                onValueChange={(value) =>
                  onFiltersChange({
                    hasSeries: value === "" ? undefined : value === "true",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Has Series</SelectItem>
                  <SelectItem value="false">No Series</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Read Time Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Read Time (minutes)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minReadTime || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      minReadTime: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxReadTime || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      maxReadTime: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Engagement Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Engagement Score</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minEngagement || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      minEngagement: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxEngagement || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      maxEngagement: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sortBy" className="text-sm font-medium">
                Sort By
              </Label>
              <Select
                value={filters.sortBy || "publishedAt"}
                onValueChange={(value) =>
                  onFiltersChange({
                    sortBy: value as ArticleFilters["sortBy"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="publishedAt">Published Date</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="reads">Reads</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="readTime">Read Time</SelectItem>
                  <SelectItem value="completionRate">Completion Rate</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder" className="text-sm font-medium">
                Order
              </Label>
              <Select
                value={filters.sortOrder || "desc"}
                onValueChange={(value) =>
                  onFiltersChange({
                    sortOrder: value as ArticleFilters["sortOrder"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
