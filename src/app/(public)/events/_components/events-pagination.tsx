import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { publicEventsHref } from "../_lib/public-events-query";

interface EventsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  searchParams: URLSearchParams;
}

/**
 * Link-based pagination for the public events list (UI-24 item 1), built on
 * the shared pagination primitive (UI-09) like the member directory: every
 * control is a server-rendered anchor, so paging works without JavaScript
 * and stays crawlable. Active filters survive page changes because the
 * current searchParams are carried into every href.
 */
export function EventsPagination({ page, totalPages, total, searchParams }: EventsPaginationProps) {
  if (total === 0) return null;

  // Honest end state: everything already fits on one page.
  if (totalPages <= 1) {
    return (
      <p className="text-muted-foreground text-center text-sm" role="status">
        Showing all {total} {total === 1 ? "event" : "events"}.
      </p>
    );
  }

  return (
    <Pagination aria-label="Events pagination" className="justify-between">
      <PaginationContent className="w-full justify-between">
        <PaginationItem>
          {page > 1 ? (
            <PaginationPrevious variant="outline" size="sm" asChild>
              <Link href={publicEventsHref(searchParams, page - 1)}>Previous</Link>
            </PaginationPrevious>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
        </PaginationItem>

        <PaginationItem>
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} · {total} {total === 1 ? "event" : "events"}
          </p>
        </PaginationItem>

        <PaginationItem>
          {page < totalPages ? (
            <PaginationNext variant="outline" size="sm" asChild>
              <Link href={publicEventsHref(searchParams, page + 1)}>Next</Link>
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
