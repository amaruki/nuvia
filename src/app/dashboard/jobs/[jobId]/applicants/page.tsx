
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { applicants as initialMockApplicants, Applicant } from "../../_data/mock-applicants";
import { jobs } from "../../_data/mock-jobs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, FileText, Mail, Phone, MoreHorizontal, Download, CheckCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export default function JobApplicantsPage() {
    const params = useParams();
    const router = useRouter();
    const { setHeader, clearHeader } = useHeader();
    const jobId = params.jobId as string;

    const job = jobs.find(j => j.id === jobId);

    // Use local state for applicants to simulate status updates
    const [localApplicants, setLocalApplicants] = useState<Applicant[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Initialize with mock data filtered by job
        const jobApps = initialMockApplicants.filter(a => a.jobId === jobId);
        setLocalApplicants(jobApps);
    }, [jobId]);

    useEffect(() => {
        if (job) {
            setHeader({
                title: `Applicants: ${job.title}`,
                description: `Manage applications for ${job.company}`,
            });
        }

        return () => {
            clearHeader();
        };
    }, [setHeader, clearHeader, job]);

    const handleStatusChange = (applicantId: string, newStatus: Applicant['status']) => {
        setLocalApplicants(prev => prev.map(app =>
            app.id === applicantId ? { ...app, status: newStatus } : app
        ));
    };

    const filteredApplicants = localApplicants.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusClass = (status: Applicant['status']) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-none';
            case 'Screening': return 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-none';
            case 'Interview': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none';
            case 'Offer': return 'bg-green-100 text-green-800 hover:bg-green-100 border-none';
            case 'Rejected': return 'bg-red-100 text-red-800 hover:bg-red-100 border-none';
            default: return '';
        }
    }

    const statusOptions: Applicant['status'][] = ["New", "Screening", "Interview", "Offer", "Rejected"];

    if (!job) return <div>Job not found</div>;

    return (
        <div className="space-y-6 animate-fadeInUp">
            <Button variant="ghost" onClick={() => router.push("/dashboard/jobs")} className="pl-0 hover:pl-0 hover:bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
            </Button>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search applicants..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Applied Date</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredApplicants.map((applicant) => (
                            <TableRow key={applicant.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/jobs/${jobId}/applicants/${applicant.id}`)}>
                                        <span className="text-base font-semibold">{applicant.name}</span>
                                        {applicant.coverLetter && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={applicant.coverLetter}>
                                                {applicant.coverLetter}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getStatusClass(applicant.status)}>
                                        {applicant.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{applicant.appliedDate}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {applicant.email}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Phone className="h-3 w-3" /> {applicant.phone}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Update Status
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    {statusOptions.map((status) => (
                                                        <DropdownMenuItem
                                                            key={status}
                                                            onClick={() => handleStatusChange(applicant.id, status)}
                                                            disabled={applicant.status === status}
                                                        >
                                                            {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>

                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/jobs/${jobId}/applicants/${applicant.id}`)}>
                                                <FileText className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Mail className="mr-2 h-4 w-4" /> Email Candidate
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredApplicants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No applicants found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
