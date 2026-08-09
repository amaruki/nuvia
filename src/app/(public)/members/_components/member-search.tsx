"use client";

/**
 * Directory search box (UI-28). Submits as a GET navigation to
 * /members?query=… so the search works without JavaScript and stays in the
 * URL (shareable, paginatable).
 */

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MemberSearchProps {
  defaultValue: string;
}

export function MemberSearch({ defaultValue }: MemberSearchProps) {
  const router = useRouter();

  return (
    <search className="w-full max-w-md">
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          const query = new FormData(event.currentTarget).get("query");
          const trimmed = typeof query === "string" ? query.trim() : "";
          router.push(trimmed ? `/members?query=${encodeURIComponent(trimmed)}` : "/members");
        }}
      >
        <Label htmlFor="member-search" className="sr-only">
          Search members
        </Label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="member-search"
          name="query"
          type="search"
          defaultValue={defaultValue}
          placeholder="Search by name or bio…"
          className="pl-9"
        />
      </form>
    </search>
  );
}
