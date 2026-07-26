"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { EventCertificateList } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Award, ArrowRight } from "lucide-react";
import { EventCertificate, Event } from "@/types/event.types";
import { getUserEventRegistrations } from "@/lib/services/event.service";

interface EnhancedCertificatesWidgetProps {
  limit?: number;
  onViewAllCertificates?: () => void;
  onViewCertificate?: (certificateId: string) => void;
  onDownload?: (certificateUrl: string) => void;
  className?: string;
}

export function EnhancedCertificatesWidget({
  limit = 3,
  onViewAllCertificates,
  onViewCertificate,
  onDownload,
  className = "",
}: EnhancedCertificatesWidgetProps) {
  const [certificates, setCertificates] = React.useState<EventCertificate[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);

        // Fetch user registrations with certificates
        const registrations = await getUserEventRegistrations("current-user-id", ["confirmed"]);

        // Filter for registrations with certificates
        const certs: EventCertificate[] = [];
        const evts: Event[] = [];

        for (const registration of registrations) {
          if (registration.certificateIssued && registration.certificateUrl) {
            // Create a mock certificate object
            const certificate: EventCertificate = {
              id: `cert-${registration.id}`,
              eventId: registration.eventId,
              userId: registration.userId,
              issuedAt: registration.checkedInAt || new Date(),
              certificateUrl: registration.certificateUrl,
              verificationCode: `VERIFY-${registration.id.substring(0, 8).toUpperCase()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            certs.push(certificate);

            // If we have the event data, add it to our events array
            // In a real implementation, we would fetch event details for each certificate
          }
        }

        setCertificates(certs.slice(0, limit));
        setEvents(evts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch certificates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [limit]);

  const handleViewAllCertificates = () => {
    if (onViewAllCertificates) {
      onViewAllCertificates();
    } else {
      window.location.href = "/events/certificates";
    }
  };

  const handleViewCertificate = (certificateId: string) => {
    if (onViewCertificate) {
      onViewCertificate(certificateId);
    } else {
      window.location.href = `/certificates/${certificateId}`;
    }
  };

  const handleDownload = (certificateUrl: string) => {
    if (onDownload) {
      onDownload(certificateUrl);
    } else {
      window.open(certificateUrl, "_blank");
    }
  };

  return (
    <WidgetContainer
      type="certificates"
      title="My Certificates"
      description="View and download certificates from events you've attended"
      size="large"
      className={className}
    >
      <div className="space-y-4">
        {/* Header with action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-foreground/50" />
            <span className="text-sm font-medium text-foreground/70">
              {certificates.length} certificate{certificates.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleViewAllCertificates} className="text-xs">
            View all
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Certificates list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-2 border-muted-foreground"
                style={{ borderTopColor: "var(--primary)" }}
              ></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load certificates</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8 text-foreground/50">
              <Award className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
              <p>No certificates yet</p>
              <p className="text-sm mt-2">
                Certificates will be awarded after you attend and complete events.
              </p>
            </div>
          ) : (
            <EventCertificateList
              certificates={certificates}
              events={events}
              onDownload={handleDownload}
              onViewDetails={handleViewCertificate}
              className="border-0 shadow-none p-0"
            />
          )}
        </div>

        {/* Footer with info */}
        <div className="pt-4 border-t">
          <div className="text-xs text-foreground/50 text-center">
            Certificates are automatically issued to attendees who check in to events and meet
            participation requirements.
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
