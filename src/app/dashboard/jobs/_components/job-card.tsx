
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";
import { Job } from "../_data/mock-jobs";
import Link from 'next/link';

interface JobCardProps {
    job: Job;
}

export function JobCard({ job }: JobCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold line-clamp-1">{job.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
                    </div>
                    {job.type === 'Full-time' ? (
                        <Badge variant="default" className="bg-blue-600">{job.type}</Badge>
                    ) : (
                        <Badge variant="secondary">{job.type}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <MapPin className="mr-1 h-3.5 w-3.5" />
                        {job.location}
                    </div>
                    <div className="flex items-center">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        {job.postedDate}
                    </div>
                    <div className="flex items-center">
                        <DollarSign className="mr-1 h-3.5 w-3.5" />
                        {job.salary}
                    </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                    {job.description}
                </p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/jobs/${job.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
