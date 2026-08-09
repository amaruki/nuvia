import * as React from "react";
import { Slot } from "radix-ui";
import { type VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Link-based pagination (UI-09, plan line 328): plain anchors by default so
 * server-rendered paging works without JavaScript and stays crawlable. Pass
 * `href` for a bare anchor, or `asChild` to slot in `next/link` (or a
 * button) while keeping the pagination styling.
 */

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={cn("list-none", className)} {...props} />;
}

type PaginationLinkProps = {
  /** Marks the link as the current page (`aria-current="page"` + outline style). */
  isActive?: boolean;
  /** Render the given child element (e.g. `next/link` or a button) instead of a plain `<a>`. */
  asChild?: boolean;
} & VariantProps<typeof buttonVariants> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive = false,
  variant,
  size = "icon",
  asChild = false,
  ...props
}: PaginationLinkProps) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: variant ?? (isActive ? "outline" : "ghost"), size }),
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      {children ?? (
        <>
          <ChevronLeft aria-hidden="true" />
          <span className="hidden sm:block">Previous</span>
        </>
      )}
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      {children ?? (
        <>
          <span className="hidden sm:block">Next</span>
          <ChevronRight aria-hidden="true" />
        </>
      )}
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
