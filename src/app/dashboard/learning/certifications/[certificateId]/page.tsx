"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CertificateView } from "../_components/certificate-view";
import { certificates } from "../../courses/_data/mock-data";
import { toast } from "sonner";

export default function CertificateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const certificateId = params.certificateId as string;

    const certificate = certificates.find(c => c.id === certificateId);

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
        toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: "Generating PDF...",
            success: "Certificate downloaded successfully",
            error: "Failed to download certificate",
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
    };

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between no-print">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" asChild>
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
