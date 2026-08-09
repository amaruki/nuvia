"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, ExternalLink, Award, CheckCircle } from "lucide-react";
import type { EventCertificate } from "@/types/event";
import { Event } from "@/types/event";

interface EventCertificateProps {
  certificate: EventCertificate;
  event?: Event;
  onDownload?: (certificateUrl: string) => void;
  onShare?: (certificate: EventCertificate) => void;
  onVerify?: (verificationCode: string) => void;
  className?: string;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export function EventCertificate({
  certificate,
  event,
  onDownload,
  onShare,
  onVerify,
  className = "",
}: EventCertificateProps) {
  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-chart-4 text-primary-foreground">
          <CardTitle className="flex items-center text-xl">
            <Award className="h-6 w-6 mr-2" />
            Certificate of Completion
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Certificate Preview */}
            <div className="md:col-span-2 p-6 border-r">
              <div className="bg-background border-2 border-dashed border-border rounded-lg aspect-[4/3] flex items-center justify-center mb-4">
                {certificate.certificateUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={certificate.certificateUrl}
                      alt="Certificate"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Award className="h-16 w-16 mx-auto text-foreground/40 mb-2" />
                    <p className="text-foreground/50">Certificate preview will appear here</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => onDownload?.(certificate.certificateUrl)}
                  className="flex-1"
                  disabled={!certificate.certificateUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => onShare?.(certificate)} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-foreground/90 mb-4">
                  Certificate Details
                </h4>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/50">Recipient</p>
                    <p className="font-medium text-foreground/90">
                      {certificate.user?.displayName ||
                        certificate.user?.username ||
                        "Certificate Holder"}
                    </p>
                  </div>

                  {event && (
                    <>
                      <div>
                        <p className="text-sm text-foreground/50">Event</p>
                        <p className="font-medium text-foreground/90">{event.title}</p>
                      </div>

                      <div>
                        <p className="text-sm text-foreground/50">Event Date</p>
                        <p className="font-medium text-foreground/90">
                          {formatDate(event.startDate)}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-sm text-foreground/50">Issued On</p>
                    <p className="font-medium text-foreground/90">
                      {formatDate(certificate.issuedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/50">Verification Code</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {certificate.verificationCode}
                      </p>
                      <Button
                        onClick={() => onVerify?.(certificate.verificationCode)}
                        variant="outline"
                        size="sm"
                        aria-label="Verify certificate"
                        // Growing the visual would unbalance the code row, so
                        // extend the hit area instead (sidebar technique, UI-08).
                        className="relative after:absolute after:-inset-2 md:after:hidden"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-chart-2/10 border border-success/30 text-success p-4 rounded-lg">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-success mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Verified Certificate</p>
                    <p className="text-sm mt-1">
                      This certificate has been issued and can be verified using the verification
                      code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EventCertificateListProps {
  certificates: EventCertificate[];
  events?: Event[];
  onDownload?: (certificateUrl: string) => void;
  onShare?: (certificate: EventCertificate) => void;
  onVerify?: (verificationCode: string) => void;
  onViewDetails?: (certificateId: string) => void;
  className?: string;
}

export function EventCertificateList({
  certificates,
  events = [],
  onDownload,
  onViewDetails,
  className = "",
}: EventCertificateListProps) {
  const getEventForCertificate = (certificate: EventCertificate) => {
    return events.find((event) => event.id === certificate.eventId);
  };

  if (certificates.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Award className="h-16 w-16 mx-auto text-foreground/40 mb-4" />
        <h3 className="text-lg font-medium text-foreground/90 mb-2">No Certificates Yet</h3>
        <p className="text-foreground/50 max-w-md mx-auto">
          Certificates will be awarded after you attend and complete events. Check back here after
          participating in events.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground/90">
          Your Certificates ({certificates.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((certificate) => {
          const event = getEventForCertificate(certificate);
          return (
            <Card key={certificate.id} className="overflow-hidden">
              <div className="relative h-40 bg-gradient-to-r from-info to-chart-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="h-16 w-16 text-primary-foreground/30" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-white font-medium truncate">
                    {event?.title || "Certificate"}
                  </h3>
                  <p className="text-white/80 text-sm">Issued {formatDate(certificate.issuedAt)}</p>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-foreground/50">Verification Code</p>
                    <p className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                      {certificate.verificationCode}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onDownload?.(certificate.certificateUrl)}
                      size="sm"
                      className="flex-1"
                      disabled={!certificate.certificateUrl}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      onClick={() => onViewDetails?.(certificate.id)}
                      variant="outline"
                      size="sm"
                      aria-label="View certificate details"
                      // Keep the sm visual next to Download; extend the touch
                      // target via pseudo-element instead (UI-08).
                      className="relative after:absolute after:-inset-2 md:after:hidden"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
