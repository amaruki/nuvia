"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { Award, Download, Calendar, ExternalLink } from "lucide-react"
import { Certificate } from "@/types/dashboard.types"

interface CertificatesWidgetProps {
  certificates?: Certificate[]
  onDownloadCertificate?: (certificateId: string) => void
  onViewCertificate?: (certificateId: string) => void
  onViewAllCertificates?: () => void
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
]

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const getCertificateColor = (index: number) => {
  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-pink-100 text-pink-800",
  ]
  return colors[index % colors.length]
}

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
      description={`${certificates.length} certificate${certificates.length !== 1 ? 's' : ''} available for download`}
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {certificates.length} certificates
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllCertificates}
                className="text-xs"
              >
                View all
              </Button>
            </div>
            
            {/* Certificates list */}
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {certificates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No certificates available</p>
                  <p className="text-sm mt-2">Certificates from events you've participated in will be displayed here for download.</p>
                </div>
              ) : (
                certificates.map((certificate, index) => (
                  <div
                    key={certificate.id}
                    className="p-4 rounded-lg border bg-white border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getCertificateColor(index)}`}>
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {certificate.eventName}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Issued on {formatDate(certificate.issuedDate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Certificate actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <Badge className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                      
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
              <div className="text-xs text-gray-500 text-center pt-2">
                Participate in more events to earn additional certificates
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}