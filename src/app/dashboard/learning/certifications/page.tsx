"use client";

import React, { useEffect } from "react";
import { Search, Award } from "lucide-react";
import { PageErrorState, PageLoadingState } from "@/components/dashboard/page-states";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CertificateCard } from "./_components/certificate-card";
import { useLearningCertificates } from "@/lib/hooks/use-learning-certificates";
import { useHeader } from "@/contexts/dashboard-context";

export default function CertificationsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { setHeader, clearHeader } = useHeader();
  const { certificates, loading, error } = useLearningCertificates();

  useEffect(() => {
    setHeader({
      title: "My Certifications",
      description: "View and manage your earned certificates.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const filteredCertificates = certificates.filter((cert) =>
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certificates..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {loading ? (
        <PageLoadingState cards={3} className="lg:grid-cols-3" />
      ) : error ? (
        <PageErrorState error={error} />
      ) : filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCertificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="border-2 border-dashed border-border py-24"
          icon={
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Award className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
          }
          title="No certificates found"
          description={
            searchTerm
              ? "Try adjusting your search terms."
              : "Complete courses to earn certifications."
          }
        />
      )}
    </div>
  );
}
