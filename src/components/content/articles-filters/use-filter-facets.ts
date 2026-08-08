"use client";

import { useArticles } from "@/lib/hooks/use-articles";
import type { ArticleAuthor, ArticleTag } from "@/types/article.types";

export interface FilterFacets {
  authors: ArticleAuthor[];
  tags: ArticleTag[];
}

// Author and tag facets are derived from the real articles the API
// returns (backlog F2): there is no stored facet list, so facets are
// empty until articles exist. This hook instance shares the content
// query cache with the page's own useArticles call.
export function useFilterFacets(): FilterFacets {
  const { filteredArticles } = useArticles();
  const authors = Array.from(
    new Map(filteredArticles.map((article) => [article.author.id, article.author])).values(),
  );
  const tagFacets = filteredArticles
    .flatMap((article) => article.tags)
    .map((tag, index) => ({ ...tag, id: tag.id || `tag_${index}` }));
  const tags = Array.from(new Map(tagFacets.map((tag) => [tag.id, tag])).values());

  return { authors, tags };
}
