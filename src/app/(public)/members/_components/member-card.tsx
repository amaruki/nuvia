/**
 * Directory card (UI-28) — presentational only; data comes from the
 * public-profile service's allow-listed projection.
 */

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PublicMemberCard } from "@/lib/services/member/public-profile";

import { nameInitials } from "./member-helpers";

interface MemberCardProps {
  member: PublicMemberCard;
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <Link
      href={`/members/${member.id}`}
      className="group block focus-visible:outline-none"
      aria-label={`View ${member.name}'s public profile`}
    >
      <Card className="h-full p-6 transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            {member.avatar ? (
              <AvatarImage src={member.avatar} alt={`Portrait of ${member.name}`} />
            ) : null}
            <AvatarFallback aria-hidden="true">{nameInitials(member.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
              {member.name}
            </h3>
            {member.bio ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{member.bio}</p>
            ) : (
              <p className="mt-1 text-sm italic text-muted-foreground">No bio yet.</p>
            )}
          </div>
        </div>

        {member.affiliations.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Organizational affiliations">
            {member.affiliations.map((affiliation) => (
              <li key={`${affiliation.kind}-${affiliation.unitId}`}>
                <Badge variant="secondary">
                  {affiliation.title
                    ? `${affiliation.title} · ${affiliation.unitName}`
                    : affiliation.unitName}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </Link>
  );
}
