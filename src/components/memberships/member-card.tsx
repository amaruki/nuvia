"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MembershipProfile, MembershipTier, MembershipStatus } from "@/types/membership.types";
import {
  MapPin,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Link2 as Linkedin, // lucide-react v1 dropped brand icons — see TODO.md
  Building,
  Users,
  Award,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: MembershipProfile;
  className?: string;
}

function getTierColor(tier: MembershipTier): string {
  switch (tier) {
    case MembershipTier.BASIC:
      return "bg-secondary text-secondary-foreground border-border";
    case MembershipTier.STUDENT:
      return "bg-info/15 text-info border-info/25";
    case MembershipTier.PROFESSIONAL:
      return "bg-info/15 text-info border-info/25";
    case MembershipTier.CORPORATE:
      return "bg-muted text-muted-foreground border-border";
    case MembershipTier.PREMIUM:
      return "bg-warning/15 text-warning border-warning/25";
    case MembershipTier.VIP:
      return "bg-warning/15 text-warning border-warning/25";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function getStatusColor(status: MembershipStatus): string {
  switch (status) {
    case MembershipStatus.ACTIVE:
      return "bg-success/15 text-success border-success/25";
    case MembershipStatus.EXPIRED:
      return "bg-destructive/10 text-destructive border-destructive/30";
    case MembershipStatus.PENDING:
      return "bg-warning/15 text-warning border-warning/25";
    case MembershipStatus.SUSPENDED:
      return "bg-destructive/15 text-destructive border-destructive/25";
    case MembershipStatus.CANCELLED:
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getTierAccent(tier: MembershipTier): string {
  switch (tier) {
    case MembershipTier.BASIC:
      return "border-l-muted";
    case MembershipTier.STUDENT:
      return "border-l-info";
    case MembershipTier.PROFESSIONAL:
      return "border-l-info";
    case MembershipTier.CORPORATE:
      return "border-l-muted";
    case MembershipTier.PREMIUM:
      return "border-l-warning";
    case MembershipTier.VIP:
      return "border-l-warning";
    default:
      return "border-l-muted";
  }
}

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

export function MemberCard({ member, className }: MemberCardProps) {
  const isExpired = member.membershipStatus === MembershipStatus.EXPIRED;
  const hasSocialLinks = member.linkedin || member.website;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4",
        getTierAccent(member.membershipTier),
        "hover:border-primary/20 hover:-translate-y-1",
        isExpired && "opacity-70 grayscale-[0.3]",
        className,
      )}
    >
      {/* Tier Indicator Dot */}
      <div
        className={cn(
          "absolute top-4 right-4 size-2.5 rounded-full",
          member.membershipStatus === MembershipStatus.ACTIVE
            ? "bg-success animate-pulse"
            : "bg-muted",
        )}
      />

      <CardContent>
        {/* Header Section - Improved Visual Hierarchy */}
        <div className="flex items-start gap-4 mb-5">
          <Avatar className="size-16 ring-2 ring-background shadow-md">
            <AvatarImage src={member.avatar} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-lg">
              {getInitials(member.firstName || "", member.lastName || "")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground mb-1 truncate group-hover:text-primary transition-colors">
              {member.firstName} {member.lastName}
            </h3>

            {member.jobTitle && (
              <p className="text-sm font-medium text-muted-foreground truncate mb-1.5">
                {member.jobTitle}
              </p>
            )}

            {member.company && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building className="size-3.5 flex-shrink-0" />
                <span className="truncate">{member.company}</span>
              </div>
            )}
          </div>
        </div>

        {/* Badges Section - Compact and Prominent */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5",
              getTierColor(member.membershipTier),
            )}
            variant="outline"
          >
            <Award className="size-3" />
            {member.membershipTier.charAt(0).toUpperCase() + member.membershipTier.slice(1)}
          </Badge>
          <Badge
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5",
              getStatusColor(member.membershipStatus),
            )}
            variant="outline"
          >
            <Clock className="size-3" />
            {member.membershipStatus.charAt(0).toUpperCase() + member.membershipStatus.slice(1)}
          </Badge>
        </div>

        {/* Contact Info Grid - Better Spacing */}
        <div className="space-y-2.5 mb-4 pb-4 border-b">
          {member.location && (
            <div className="flex items-center gap-2.5 text-sm group/item">
              <MapPin className="size-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
              <span className="text-foreground/80 truncate">{member.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-sm group/item">
            <Mail className="size-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
            <span className="text-foreground/80 truncate">{member.email}</span>
          </div>

          {member.phone && (
            <div className="flex items-center gap-2.5 text-sm group/item">
              <Phone className="size-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
              <span className="text-foreground/80">{member.phone}</span>
            </div>
          )}
        </div>

        {/* Membership Info - Clean Layout */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Calendar className="size-3.5" />
              <span>Member Since</span>
            </div>
            <span className="font-semibold text-foreground">
              {formatDateString(member.membershipStartDate)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Member ID</span>
            <span className="font-mono font-semibold text-foreground">{member.memberId}</span>
          </div>

          {member.chapter && (
            <div className="flex items-center gap-1.5 text-xs pt-1 border-t">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium">{member.chapter}</span>
            </div>
          )}
        </div>

        {/* Skills Section - Improved Visual */}
        {member.skills && member.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {member.skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-primary/5 text-primary rounded-full border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  {skill}
                </span>
              ))}
              {member.skills.length > 4 && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  +{member.skills.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Social Links - Enhanced Hover States */}
        {hasSocialLinks && (
          <div className="flex items-center gap-3 pt-3 border-t">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-8 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                onClick={(e) => e.stopPropagation()}
              >
                <Linkedin className="size-4" />
              </a>
            )}
            {member.website && (
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-8 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
