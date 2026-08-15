"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MembershipProfile, MembershipTier, MembershipStatus } from "@/types/membership.types";
import {
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Link2 as Linkedin, // lucide-react v1 dropped brand icons — see TODO.md
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: MembershipProfile;
  /** "grid" renders the directory card, "list" the compact horizontal row. */
  variant?: "grid" | "list";
  className?: string;
}

const FALLBACK_BADGE = "bg-muted text-muted-foreground border-border";

const TIER_BADGE_COLORS: Record<MembershipTier, string> = {
  [MembershipTier.BASIC]: "bg-secondary text-secondary-foreground border-border",
  [MembershipTier.STUDENT]: "bg-info/15 text-info border-info/25",
  [MembershipTier.PROFESSIONAL]: "bg-info/15 text-info border-info/25",
  [MembershipTier.CORPORATE]: "bg-muted text-muted-foreground border-border",
  [MembershipTier.PREMIUM]: "bg-warning/15 text-warning border-warning/25",
  [MembershipTier.VIP]: "bg-warning/15 text-warning border-warning/25",
};

const STATUS_BADGE_COLORS: Record<MembershipStatus, string> = {
  [MembershipStatus.ACTIVE]: "bg-success/15 text-success border-success/25",
  [MembershipStatus.EXPIRED]: "bg-destructive/10 text-destructive border-destructive/30",
  [MembershipStatus.PENDING]: "bg-warning/15 text-warning border-warning/25",
  [MembershipStatus.SUSPENDED]: "bg-destructive/15 text-destructive border-destructive/25",
  [MembershipStatus.CANCELLED]: FALLBACK_BADGE,
};

/** Avatar corner dot — reads membership status at a glance in both views. */
const STATUS_DOT_COLORS: Record<MembershipStatus, string> = {
  [MembershipStatus.ACTIVE]: "bg-success",
  [MembershipStatus.PENDING]: "bg-warning",
  [MembershipStatus.EXPIRED]: "bg-destructive",
  [MembershipStatus.SUSPENDED]: "bg-destructive",
  [MembershipStatus.CANCELLED]: "bg-muted-foreground/40",
};

const META_LABEL_CLASS = "text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

function formatDateString(date: Date | null): string {
  if (!date) return "Lifetime";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getSubtitle(member: MembershipProfile): string {
  return [member.jobTitle, member.company].filter(Boolean).join(" · ");
}

function MemberAvatar({ member, className }: { member: MembershipProfile; className?: string }) {
  return (
    <div className="relative shrink-0">
      <Avatar className={className}>
        <AvatarImage src={member.avatar} alt={`${member.firstName} ${member.lastName}`} />
        {/* Solid primary + primary-foreground pair: the previous
            bg-primary/10 + text-primary tint read at ~1.9:1 on light card
            (WCAG AA needs 4.5:1; axe color-contrast). The solid pair is
            ~11:1 in both themes. */}
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
          {getInitials(member.firstName || "", member.lastName || "")}
        </AvatarFallback>
      </Avatar>
      <span
        aria-hidden="true"
        className={cn(
          "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card",
          STATUS_DOT_COLORS[member.membershipStatus],
        )}
      />
    </div>
  );
}

function MemberBadges({ member }: { member: MembershipProfile }) {
  const tier = TIER_BADGE_COLORS[member.membershipTier] ?? FALLBACK_BADGE;
  const status = STATUS_BADGE_COLORS[member.membershipStatus] ?? FALLBACK_BADGE;
  return (
    <>
      <Badge variant="outline" className={cn("font-semibold", tier)}>
        {capitalize(member.membershipTier)}
      </Badge>
      <Badge variant="outline" className={cn("font-semibold", status)}>
        {capitalize(member.membershipStatus)}
      </Badge>
    </>
  );
}

function ContactRow({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="truncate text-foreground/80">{children}</span>
    </div>
  );
}

function SocialLinks({ member }: { member: MembershipProfile }) {
  const linkClass =
    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  return (
    <div className="flex shrink-0 gap-1">
      {member.linkedin && (
        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open LinkedIn profile of ${member.firstName} ${member.lastName}`}
          className={linkClass}
        >
          <Linkedin className="size-4" aria-hidden="true" />
        </a>
      )}
      {member.website && (
        <a
          href={member.website}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open website of ${member.firstName} ${member.lastName}`}
          className={linkClass}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function MemberMeta({ member }: { member: MembershipProfile }) {
  return (
    <>
      <div className="min-w-0">
        <div className={META_LABEL_CLASS}>Member since</div>
        <div className="mt-1 truncate text-sm font-semibold text-foreground">
          {formatDateString(member.membershipStartDate)}
        </div>
      </div>
      <div className="min-w-0 text-right">
        <div className={META_LABEL_CLASS}>Member ID</div>
        <div className="mt-1 truncate font-mono text-sm font-semibold text-foreground">
          {member.memberId}
        </div>
      </div>
    </>
  );
}

/** Shared card shell: quiet border, subtle hover, no fake pointer affordance. */
function cardShell(isExpired: boolean, className?: string): string {
  return cn(
    "gap-0 py-0 transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-md",
    isExpired && "opacity-60",
    className,
  );
}

function GridCard({ member, className }: { member: MembershipProfile; className?: string }) {
  const subtitle = getSubtitle(member);
  const isExpired = member.membershipStatus === MembershipStatus.EXPIRED;

  return (
    <Card className={cn(cardShell(isExpired), "h-full", className)}>
      <CardContent className="flex h-full flex-col p-5">
        {/* Identity */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <MemberAvatar member={member} className="size-12" />
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">
                {member.firstName} {member.lastName}
              </h3>
              {subtitle && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {(member.linkedin || member.website) && <SocialLinks member={member} />}
        </div>

        {/* Membership badges */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <MemberBadges member={member} />
        </div>

        {/* Contact — flex-1 keeps the footer pinned to the card bottom */}
        <div className="flex-1">
          <div className="mt-4 space-y-2 text-sm">
            <ContactRow icon={Mail}>{member.email}</ContactRow>
            {member.location && <ContactRow icon={MapPin}>{member.location}</ContactRow>}
            {member.phone && <ContactRow icon={Phone}>{member.phone}</ContactRow>}
            {member.chapter && <ContactRow icon={Users}>{member.chapter}</ContactRow>}
          </div>

          {member.skills && member.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {member.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
              {member.skills.length > 4 && (
                <span className="px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  +{member.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-3.5">
          <MemberMeta member={member} />
        </div>
      </CardContent>
    </Card>
  );
}

function ListRow({ member, className }: { member: MembershipProfile; className?: string }) {
  const subtitle = getSubtitle(member);
  const isExpired = member.membershipStatus === MembershipStatus.EXPIRED;

  return (
    <Card className={cn(cardShell(isExpired), className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          {/* Identity */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <MemberAvatar member={member} className="size-11" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {member.firstName} {member.lastName}
              </h3>
              {subtitle && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
              )}
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{member.email}</span>
              </p>
            </div>
          </div>

          {/* Membership badges */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <MemberBadges member={member} />
          </div>

          {/* Membership meta */}
          <div className="flex items-center justify-between gap-6 border-t pt-3 md:justify-end md:border-0 md:pt-0">
            <MemberMeta member={member} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MemberCard({ member, variant = "grid", className }: MemberCardProps) {
  if (variant === "list") {
    return <ListRow member={member} className={className} />;
  }
  return <GridCard member={member} className={className} />;
}
