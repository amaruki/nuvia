"use client";

import { usePublications } from "@/lib/hooks/use-publications";
import type { PublicationAuthor, PublicationTag } from "@/types/publication";

export interface FilterFacets {
  authors: PublicationAuthor[];
  tags: PublicationTag[];
}

// Author and tag facets are derived from the real publications the API
// returns (backlog F2): there is no stored facet list, so facets are
// empty until publications exist. This hook instance shares the content
// query cache with the page's own usePublications call.
export function useFilterFacets(): FilterFacets {
  const { filteredPublications } = usePublications();
  const authors = Array.from(
    new Map(
      filteredPublications.map((publication) => [publication.author.id, publication.author]),
    ).values(),
  );
  const tagFacets = filteredPublications
    .flatMap((publication) => publication.tags)
    .map((tag, index) => ({ ...tag, id: tag.id || `tag_${index}` }));
  const tags = Array.from(new Map(tagFacets.map((tag) => [tag.id, tag])).values());

  return { authors, tags };
}
