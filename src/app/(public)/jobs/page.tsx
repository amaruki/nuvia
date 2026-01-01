
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Filter, Briefcase } from "lucide-react";
import { jobs } from "@/app/dashboard/jobs/_data/mock-jobs";
import { JobCard } from "@/app/dashboard/jobs/_components/job-card";
import { Badge } from "@/components/ui/badge";

export default function PublicJobBoardPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const uniqueTypes = Array.from(new Set(jobs.map((job) => job.type)));

    const filteredJobs = jobs.filter((job) => {
        const matchesSearch =
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType ? job.type === selectedType : true;
        // Only show active jobs on the front page
        return matchesSearch && matchesType && job.status === "Active";
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-primary/5 border-b py-12 md:py-20">
                <div className="container mx-auto px-4 max-w-6xl text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Find Your Dream Job
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Browse hundreds of job openings from top companies and startups.
                        Your next career move starts here.
                    </p>

                    <div className="bg-background border rounded-xl p-2 shadow-lg max-w-3xl mx-auto flex flex-col md:flex-row gap-2 mt-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                className="pl-10 h-12 border-0 focus-visible:ring-0 text-base"
                                placeholder="Job title, keywords, or company"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="hidden md:block w-px bg-border my-2"></div>
                        <div className="relative flex-1">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                className="pl-10 h-12 border-0 focus-visible:ring-0 text-base"
                                placeholder="City, state, or remote"
                            />
                        </div>
                        <Button className="h-12 px-8 text-base">Search Jobs</Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl py-12 space-y-8">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium mr-2 flex items-center">
                        <Filter className="h-4 w-4 mr-1" />
                        Filters:
                    </span>
                    <Badge
                        variant={selectedType === null ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80 px-4 py-1.5 text-sm"
                        onClick={() => setSelectedType(null)}
                    >
                        All Types
                    </Badge>
                    {uniqueTypes.map((type) => (
                        <Badge
                            key={type}
                            variant={selectedType === type ? "default" : "outline"}
                            className="cursor-pointer hover:opacity-80 px-4 py-1.5 text-sm"
                            onClick={() => setSelectedType(type)}
                        >
                            {type}
                        </Badge>
                    ))}
                </div>

                {/* Jobs Grid */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Latest Opportunities ({filteredJobs.length})
                    </h2>

                    {filteredJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredJobs.map((job) => (
                                <JobCard key={job.id} job={job} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No jobs found</h3>
                            <p className="text-muted-foreground text-center max-w-sm mt-1">
                                We couldn't find any jobs matching your search criteria.
                            </p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedType(null);
                                }}
                                className="mt-2"
                            >
                                Clear filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
