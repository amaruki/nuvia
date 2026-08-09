/**
 * Directory pagination (UI-28) — plain links so paging works without
 * JavaScript and stays crawlable.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface MemberPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  query: string;
}

function hrefFor(page: number, query: string): string {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("page", String(page));
  return `/members?${params.toString()}`;
}

export function MemberPagination({ page, totalPages, total, query }: MemberPaginationProps) {
  if (total === 0) return null;

  return (
    <nav aria-label="Member directory pagination" className="flex items-center justify-between">
      {page > 1 ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={hrefFor(page - 1, query)}>Previous</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}

      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {total} {total === 1 ? "member" : "members"}
      </p>

      {page < totalPages ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={hrefFor(page + 1, query)}>Next</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      )}
    </nav>
  );
}
