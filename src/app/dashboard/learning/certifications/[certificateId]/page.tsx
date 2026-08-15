"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CertificateView } from "../_components/certificate-view";
import { useCertificate } from "@/lib/hooks/use-learning-certificates";
import { useHeader } from "@/contexts/dashboard-context";
import { toast } from "sonner";

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const certificateId = params.certificateId as string;

  const { data: certificate, isPending } = useCertificate(certificateId);

  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({ title: "My Certificate" });
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm text-muted-foreground">
        Loading certificate…
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-2xl font-bold">Certificate Not Found</h2>
        <p className="text-muted-foreground">The certificate you are looking for does not exist.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info("PDF download is not available yet.");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <Button
          variant="ghost"
          className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
          asChild
        >
          <Link href="/dashboard/learning/certifications">
            <ArrowLeft className="h-4 w-4" /> Back to Certifications
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="flex justify-center pb-12">
        <CertificateView certificate={certificate} />
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          /* Ensure background graphics are printed */
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
