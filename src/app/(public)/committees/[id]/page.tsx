/**
 * Public committee detail (plan UI-29) — purpose, description, leadership
 * names and unit contact/meeting info. Ring-0 read via getPublicCommittee();
 * committees store status as lowercase text and only "active" is
 * audience-ready, so missing or non-active committees render the not-found
 * state (unreachable). See src/lib/services/committee/public.ts.
 */

import Link from "next/link";
import { ArrowLeft, ArrowRight, Globe, Mail, MapPin, Phone, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { getPublicCommittee, type PublicCommittee } from "@/lib/services/committee";

import { COMMITTEE_TYPE_LABELS } from "../_components/committee-card";

export const dynamic = "force-dynamic";

export default async function PublicCommitteeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let committeeData: PublicCommittee | null = null;
  let loadFailed = false;
  try {
    committeeData = await getPublicCommittee(id);
  } catch (error) {
    logger.error("public committee page: read failed", { error: String(error), id });
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t load this committee. Please try again in a few minutes.
          </p>
          <Link href="/committees" className="text-blue-600 hover:underline">
            Back to committees
          </Link>
        </div>
      </div>
    );
  }

  if (!committeeData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Committee not found</h1>
          <p className="text-muted-foreground mb-6">
            This committee doesn&apos;t exist or isn&apos;t currently active.
          </p>
          <Link href="/committees" className="text-blue-600 hover:underline">
            Back to committees
          </Link>
        </div>
      </div>
    );
  }

  const { contact } = committeeData;
  const hasMeetingInfo = Boolean(contact.meetingLocation || contact.virtualMeetingLink);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/committees"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to committees
          </Link>
          <h1 className="text-3xl font-bold mb-2">{committeeData.displayName}</h1>
          <p className="text-xl text-muted-foreground mb-4">{committeeData.purpose}</p>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <Badge variant="secondary">{COMMITTEE_TYPE_LABELS[committeeData.type]}</Badge>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {committeeData.memberCount} member{committeeData.memberCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {committeeData.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About this committee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {committeeData.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Leadership</CardTitle>
                </CardHeader>
                <CardContent>
                  {committeeData.leadership.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Leadership information is being updated.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {committeeData.leadership.map((leader) => (
                        <li
                          key={`${leader.role}-${leader.name}`}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="font-medium">{leader.name}</span>
                          <span className="text-sm text-muted-foreground">{leader.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <Mail className="h-4 w-4 mr-2 shrink-0" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <Phone className="h-4 w-4 mr-2 shrink-0" />
                    {contact.phone}
                  </a>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <Globe className="h-4 w-4 mr-2 shrink-0" />
                    {contact.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </CardContent>
            </Card>

            {hasMeetingInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Meetings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {contact.meetingLocation && (
                    <div className="flex items-start text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                      {contact.meetingLocation}
                    </div>
                  )}
                  {contact.virtualMeetingLink && (
                    <a
                      href={contact.virtualMeetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      <Video className="h-4 w-4 mr-2 shrink-0" />
                      Join virtual meeting
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Cross-link */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Want to see local chapters too?</h2>
          <p className="text-muted-foreground mb-6">
            Chapters organize members by region with their own leadership and meetings.
          </p>
          <Link
            href="/chapters"
            className="inline-flex items-center text-blue-600 hover:underline font-medium"
          >
            Browse chapters
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
