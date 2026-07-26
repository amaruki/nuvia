"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { Card, CardContent } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../../ui/badge";
import { Award, Download, Calendar, ExternalLink } from "lucide-react";
import { Certificate } from "@/types/dashboard.types";

interface CertificatesWidgetProps {
  certificates?: Certificate[];
  onDownloadCertificate?: (certificateId: string) => void;
  onViewCertificate?: (certificateId: string) => void;
  onViewAllCertificates?: () => void;
}

// Mock certificates data - in a real app, this would come from an API
const mockCertificates: Certificate[] = [
  {
    id: "1",
    eventName: "Web Development Workshop",
    issuedDate: new Date("2023-09-15T10:30:00"),
    downloadUrl: "/certificates/web-dev-workshop.pdf",
  },
  {
    id: "2",
    eventName: "Community Leadership Training",
    issuedDate: new Date("2023-08-20T14:15:00"),
    downloadUrl: "/certificates/leadership-training.pdf",
  },
  {
    id: "3",
    eventName: "Design Thinking Seminar",
    issuedDate: new Date("2023-07-10T09:45:00"),
    downloadUrl: "/certificates/design-thinking.pdf",
  },
];

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getCertificateColor = (index: number) => {
  const colors = [
    "bg-info/20 text-info",
    "bg-purple-100 text-purple-800",
    "bg-chart-2/20 text-success",
    "bg-warning/20 text-warning",
    "bg-pink-100 text-pink-800",
  ];
  return colors[index % colors.length];
};

export function CertificatesWidget({
  certificates = mockCertificates,
  onDownloadCertificate,
  onViewCertificate,
  onViewAllCertificates,
}: CertificatesWidgetProps) {
  return (
    <WidgetContainer
      type="certificates"
      title="Certificates"
      description={`${certificates.length} certificate${certificates.length !== 1 ? "s" : ""} available for download`}
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {certificates.length} certificates
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewAllCertificates} className="text-xs">
                View all
              </Button>
            </div>

            {/* Certificates list */}
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {certificates.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <Award className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
                  <p>No certificates available</p>
                  <p className="text-sm mt-2">
                    Certificates from events you've participated in will be displayed here for
                    download.
                  </p>
                </div>
              ) : (
                certificates.map((certificate, index) => (
                  <div key={certificate.id} className="p-4 rounded-lg border bg-card border-border">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${getCertificateColor(index)}`}
                      >
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground/90 truncate">
                          {certificate.eventName}
                        </h3>
                        <div className="flex items-center text-xs text-foreground/50 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Issued on {formatDate(certificate.issuedDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Certificate actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <Badge className="bg-chart-2/20 text-success">Available</Badge>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadCertificate?.(certificate.id)}
                          className="text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewCertificate?.(certificate.id)}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Empty state hint */}
            {certificates.length > 0 && (
              <div className="text-xs text-foreground/50 text-center pt-2">
                Participate in more events to earn additional certificates
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
