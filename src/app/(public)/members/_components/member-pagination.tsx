/**
 * Directory pagination (UI-28) — plain links so paging works without
 * JavaScript and stays crawlable. Built on the shared pagination primitive
 * (UI-09); every control stays a server-rendered anchor.
 */

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
    <Pagination aria-label="Member directory pagination" className="justify-between">
      <PaginationContent className="w-full justify-between">
        <PaginationItem>
          {page > 1 ? (
            <PaginationPrevious variant="outline" size="sm" asChild>
              <Link href={hrefFor(page - 1, query)}>Previous</Link>
            </PaginationPrevious>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
        </PaginationItem>

        <PaginationItem>
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} · {total} {total === 1 ? "member" : "members"}
          </p>
        </PaginationItem>

        <PaginationItem>
          {page < totalPages ? (
            <PaginationNext variant="outline" size="sm" asChild>
              <Link href={hrefFor(page + 1, query)}>Next</Link>
            </PaginationNext>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
