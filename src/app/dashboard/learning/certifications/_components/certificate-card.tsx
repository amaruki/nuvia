"use client";

import Link from "next/link";
import { ShieldCheck, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Certificate } from "../../courses/_types";

interface CertificateCardProps {
    certificate: Certificate;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
    return (
        <Card className="hover:shadow-lg transition-all duration-300 group border-border overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-primary/70" />
            <CardHeader className="space-y-4 pb-4">
                <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                        Verified
                    </Badge>
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {certificate.courseName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Instructor: {certificate.instructorName}</p>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 mr-2" />
                    Issued on {certificate.issueDate}
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <Button variant="outline" className="w-full group-hover:border-primary/50 group-hover:bg-primary/5" asChild>
                    <Link href={`/dashboard/learning/certifications/${certificate.id}`}>
                        View Certificate <ExternalLink className="h-3.5 w-3.5 ml-2" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
