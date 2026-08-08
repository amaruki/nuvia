import type { ArticleFilters } from "@/types/article.types";

export interface FiltersControlProps {
  filters: ArticleFilters;
  onFiltersChange: (filters: Partial<ArticleFilters>) => void;
}

export interface ArticlesFiltersProps {
  filters: ArticleFilters;
  onFiltersChange: (filters: Partial<ArticleFilters>) => void;
  onClearFilters: () => void;
}
