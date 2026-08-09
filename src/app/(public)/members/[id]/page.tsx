/**
 * Public member profile (UI-28, decision D7).
 *
 * Server Component reading through `getPublicProfile` — an allow-listed
 * projection that returns null unless the member opted in (`profilePublic`,
 * default off) and is not soft-deleted. Hidden or missing members get a real
 * 404 via `notFound()`; we never reveal that a hidden account exists.
 *
 * RBAC `users.role` is on the plan's never-public list, so the only role
 * shown here is the organizational one: chapter/committee leadership titles.
 */

import { notFound } from "next/navigation";
import { ExternalLink, Users } from "lucide-react";

import { EventListLayout } from "@/components/events/event-list-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicProfile } from "@/lib/services/member/public-profile";

import { formatMemberSince, nameInitials, platformLabel } from "../_components/member-helpers";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Profiles change at runtime; never serve a build-time snapshot.
export const dynamic = "force-dynamic";

interface MemberProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  if (!profile) {
    notFound();
  }

  return (
    <EventListLayout
      title="Member Profile"
      icon={<Users aria-hidden="true" className="h-8 w-8 text-primary" />}
      showBackButton
      backUrl="/members"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
            <Avatar className="size-24">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={`Portrait of ${profile.name}`} />
              ) : null}
              <AvatarFallback aria-hidden="true" className="text-2xl">
                {nameInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Member since {formatMemberSince(profile.joinedAt)}
              </p>

              {profile.affiliations.length > 0 ? (
                <ul className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {profile.affiliations.map((affiliation) => (
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.bio ? (
              <p className="whitespace-pre-line text-foreground">{profile.bio}</p>
            ) : (
              <p className="italic text-muted-foreground">
                This member hasn&apos;t written a bio yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.externalLinks.length > 0 ? (
              <ul className="space-y-2">
                {profile.externalLinks.map((link) => (
                  <li key={`${link.platform}-${link.url}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                      {link.label
                        ? `${platformLabel(link.platform)} — ${link.label}`
                        : platformLabel(link.platform)}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="italic text-muted-foreground">No links shared.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </EventListLayout>
  );
}
