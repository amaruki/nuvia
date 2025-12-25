"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Certificate } from "../../courses/_types";

interface CertificateViewProps {
    certificate: Certificate;
}

export function CertificateView({ certificate }: CertificateViewProps) {
    return (
        <Card className="w-full max-w-4xl mx-auto p-8 md:p-12 bg-card text-foreground shadow-xl border-4 border-double border-primary/20 relative overflow-hidden" id="printable-certificate">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>

            {/* Decorative Corner Borders */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-primary/40 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-primary/40 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-primary/40 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-primary/40 rounded-br-lg" />

            <div className="relative z-10 text-center space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-8 w-8 text-primary"
                            >
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                <path d="M18 2h-6c-1.1 0-2 .4-2.5 1h6.5c1.1 0 2 .9 2 2v5.5c.6-.5 1-1.4 1-2.5V4c0-1.1-.9-2-2-2z" />
                            </svg>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-sm px-4 py-1 tracking-widest uppercase border-primary/20 bg-primary/5">
                        Certificate of Completion
                    </Badge>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <p className="text-muted-foreground font-serif italic text-lg">This is to certify that</p>
                    <h2 className="text-4xl md:text-5xl font-bold font-serif text-primary tracking-tight">
                        User Name
                    </h2>
                    <p className="text-muted-foreground font-serif italic text-lg">has successfully completed the course</p>
                    <div className="py-4">
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground max-w-2xl mx-auto">
                            {certificate.courseName}
                        </h3>
                    </div>
                </div>

                <Separator className="w-32 mx-auto bg-primary/20" />

                {/* Footer Details */}
                <div className="grid md:grid-cols-3 gap-8 items-end pt-8">
                    <div className="text-center md:text-left space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Date Issued</p>
                        <p className="font-medium font-serif">{certificate.issueDate}</p>
                    </div>

                    <div className="text-center space-y-2 flex flex-col items-center">
                        {/* Placeholder for Signature */}
                        <div className="h-12 w-32 relative">
                            <Image
                                src={certificate.instructorSignature}
                                alt="Signature"
                                fill
                                className="object-contain opacity-70"
                            />
                        </div>
                        <Separator className="w-40 bg-border" />
                        <div>
                            <p className="font-semibold">{certificate.instructorName}</p>
                            <p className="text-xs text-muted-foreground">Instructor</p>
                        </div>
                    </div>

                    <div className="text-center md:text-right space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Verification ID</p>
                        <p className="font-mono text-sm">{certificate.verificationCode}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
