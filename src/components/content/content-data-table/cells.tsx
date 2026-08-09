"use client";

import { format, formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import type { ContentAuthor } from "./types";

/**
 * Author cell: avatar + name. Reads `avatarUrl` — the field the content API
 * actually returns (the legacy hydrators looked at `author.image`, so
 * avatars never showed up in the old tables).
 */
export function AuthorCell({ author }: { author: ContentAuthor }) {
  const initials = author.name
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-2" title={author.name}>
      <Avatar className="size-7 shrink-0">
        {author.avatarUrl ? <AvatarImage src={author.avatarUrl} alt={author.name} /> : null}
        <AvatarFallback className="text-[10px]">{initials || "?"}</AvatarFallback>
      </Avatar>
      <span className="truncate text-sm font-medium">{author.name}</span>
    </div>
  );
}

/**
 * The wire may return the category as a plain string id or an expanded
 * `{ id, name }` object; normalize both shapes to a display label.
 */
export function categoryLabel(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return typeof value.name === "string" ? value.name : "";
  }
  return "";
}

/**
 * Date cell: absolute date as the primary value, relative time (and the full
 * timestamp) in the title so hover answers "when, roughly?" without widening
 * the column.
 */
export function DateCell({
  value,
  fallback = "—",
}: {
  value: Date | null | undefined;
  fallback?: string;
}) {
  if (!value || Number.isNaN(value.getTime())) {
    return <span className="text-muted-foreground text-sm">{fallback}</span>;
  }
  const relative = formatDistanceToNow(value, { addSuffix: true });
  return (
    <span
      className="text-sm whitespace-nowrap"
      title={`${relative} — ${format(value, "MMMM d, yyyy 'at' h:mm a")}`}
    >
      {format(value, "MMM d, yyyy")}
    </span>
  );
}

/** Single-line truncation with the full value in the title attribute. */
export function TruncateText({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("block max-w-[18rem] truncate", className)} title={value}>
      {value}
    </span>
  );
}
