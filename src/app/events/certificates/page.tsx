"use client";

import * as React from "react";
import { EventCertificateList } from "@/components/events";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Download, ExternalLink } from "lucide-react";
import { EventCertificate, Event } from "@/types/event.types";
import { getUserEventRegistrations, getEventCertificate } from "@/lib/services/event.service";
import { EventListLayout } from "@/components/events/EventListLayout";

export default function EventCertificatesPage() {
  const [certificates, setCertificates] = React.useState<EventCertificate[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch certificates directly
        // For now, we'll fetch registrations and check for certificates
        const registrations = await getUserEventRegistrations("current-user-id");
        
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
        
        setCertificates(certs);
        setEvents(evts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch certificates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleDownload = (certificateUrl: string) => {
    // In a real implementation, this would download the certificate
    window.open(certificateUrl, "_blank");
  };

  const handleShare = (certificate: EventCertificate) => {
    // Handle share logic
    if (navigator.share) {
      navigator.share({
        title: "Event Certificate",
        text: "I've earned a certificate for attending an event!",
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Certificate link copied to clipboard!");
    }
  };

  const handleVerify = (verificationCode: string) => {
    // Navigate to verification page
    window.open(`/certificates/verify/${verificationCode}`, "_blank");
  };

  const handleViewDetails = (certificateId: string) => {
    // Navigate to certificate details page
    window.location.href = `/certificates/${certificateId}`;
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <EventListLayout
      title="My Certificates"
      description="View and download certificates from events you've attended"
      icon={<Award className="h-8 w-8 text-primary" />}
      backUrl="/events"
    >
      <EventCertificateList
        certificates={certificates}
        events={events}
        onDownload={handleDownload}
        onShare={handleShare}
        onVerify={handleVerify}
        onViewDetails={handleViewDetails}
      />

      {/* Additional Information */}
      <div className="mt-12 bg-info/10 border border-info/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-info mb-3">About Certificates</h3>
        <div className="space-y-3 text-info">
          <p>
            Certificates are automatically issued to attendees who check in to events and meet the participation requirements.
          </p>
          <p>
            Each certificate contains a unique verification code that can be used to confirm its authenticity.
          </p>
          <p>
            You can download your certificates as PDF files or share them directly on social media and professional networks.
          </p>
        </div>
      </div>
    </EventListLayout>
  );
}