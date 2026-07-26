"use client";

import React, { useEffect } from "react";
import { Search, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CertificateCard } from "./_components/certificate-card";
import { certificates } from "../courses/_data/mock-data";
import { useHeader } from "@/contexts/dashboard-context";

export default function CertificationsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { setHeader, clearHeader } = useHeader();

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
    <div className="container mx-auto p-6 space-y-8 animate-fadeIn">
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

      {filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/5 rounded-lg border-2 border-dashed border-border">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <Award className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-semibold">No certificates found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {searchTerm
              ? "Try adjusting your search terms."
              : "Complete courses to earn certifications."}
          </p>
        </div>
      )}
    </div>
  );
}
