/**
 * UI-30: organizer credit on the public event detail.
 *
 * Name and avatar render for every organizer; the link to /members/[id]
 * renders only when the organizer opted into the public directory (UI-28,
 * decision D7). `credit` is null when the organizer's user row no longer
 * exists — the fallback name keeps the card honest.
 */

import Link from "next/link";

import { nameInitials } from "@/app/(public)/members/_components/member-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { OrganizerCredit } from "@/lib/services/member/public-profile";

interface OrganizerCreditCardProps {
  credit: OrganizerCredit | null;
  fallbackName: string;
}

export function OrganizerCreditCard({ credit, fallbackName }: OrganizerCreditCardProps) {
  const name = credit?.name ?? fallbackName;
  const avatar = credit?.avatar ?? null;
  const href = credit?.profilePublic ? `/members/${credit.id}` : null;

  const content = (
    <>
      <Avatar className="mr-4 size-12">
        {avatar ? <AvatarImage src={avatar} alt={`Portrait of ${name}`} /> : null}
        <AvatarFallback aria-hidden="true">{nameInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="text-sm text-foreground/60">Event Organizer</p>
      </div>
    </>
  );

  if (!href) {
    return <div className="flex items-center">{content}</div>;
  }

  return (
    <Link
      href={href}
      aria-label={`View ${name}'s public profile`}
      className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}
