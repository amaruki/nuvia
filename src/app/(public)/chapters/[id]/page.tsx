/**
 * Public chapter detail (plan UI-29) — description, leadership names,
 * meeting cadence and unit contact info. Ring-0 read via getPublicChapter();
 * missing or non-ACTIVE chapters render the not-found state (unreachable).
 */

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { getPublicChapter, type PublicChapter } from "@/lib/services/chapter";
import { formatDate } from "@/lib/utils/date-utils";

export const dynamic = "force-dynamic";

const FREQUENCY_LABELS: Record<PublicChapter["meeting"]["frequency"], string> = {
  weekly: "Weekly",
  biweekly: "Every two weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

const SOCIAL_LINKS = [
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
] as const;

export default async function PublicChapterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let chapterData: PublicChapter | null = null;
  let loadFailed = false;
  try {
    chapterData = await getPublicChapter(id);
  } catch (error) {
    logger.error("public chapter page: read failed", { error: String(error), id });
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t load this chapter. Please try again in a few minutes.
          </p>
          <Link href="/chapters" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to chapters
          </Link>
        </div>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
          <p className="text-muted-foreground mb-6">
            This chapter doesn&apos;t exist or isn&apos;t currently active.
          </p>
          <Link href="/chapters" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to chapters
          </Link>
        </div>
      </div>
    );
  }

  const location = [chapterData.city, chapterData.state, chapterData.country]
    .filter(Boolean)
    .join(", ");
  const socialLinks = SOCIAL_LINKS.filter(({ key }) => chapterData.socialMedia[key]);
  const { contact, meeting } = chapterData;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/chapters"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to chapters
          </Link>
          <h1 className="text-3xl font-bold mb-2">{chapterData.displayName}</h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            {location && (
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {location}
              </span>
            )}
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {chapterData.memberCount} member{chapterData.memberCount === 1 ? "" : "s"}
            </span>
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Established {formatDate(chapterData.establishedDate, "yyyy")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {chapterData.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About this chapter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {chapterData.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Leadership</CardTitle>
                </CardHeader>
                <CardContent>
                  {chapterData.leadership.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Leadership information is being updated.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {chapterData.leadership.map((leader) => (
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
            {(meeting.frequency || meeting.day || meeting.time) && (
              <Card>
                <CardHeader>
                  <CardTitle>Meetings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {meeting.frequency && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                      {FREQUENCY_LABELS[meeting.frequency]}
                    </div>
                  )}
                  {meeting.day && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                      {meeting.day}
                    </div>
                  )}
                  {meeting.time && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                      {meeting.time}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Mail className="h-4 w-4 mr-2 shrink-0" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
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
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Globe className="h-4 w-4 mr-2 shrink-0" />
                    {contact.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {contact.address && (
                  <div className="flex items-start text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                    {contact.address}
                  </div>
                )}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                    {socialLinks.map(({ key, label }) => (
                      <a
                        key={key}
                        href={chapterData.socialMedia[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Globe className="h-4 w-4 mr-1 shrink-0" />
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cross-link */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/10 to-accent/60 border border-border rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Want to see the working groups too?</h2>
          <p className="text-muted-foreground mb-6">
            Committees carry specific mandates between chapter meetings.
          </p>
          <Link
            href="/committees"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Browse committees
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
