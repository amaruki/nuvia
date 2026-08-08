import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  EMPLOYMENT_TYPE_LABELS,
  formatDate,
  formatSalary,
  type JobPostingDto,
} from "@/types/jobs.types";

interface JobCardProps {
  job: JobPostingDto;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl font-bold line-clamp-1">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{job.companyName}</p>
          </div>
          {job.employmentType === "FULL_TIME" ? (
            <Badge variant="default" className="bg-blue-600 shrink-0">
              {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="mr-1 h-3.5 w-3.5" />
            {job.locationName}
          </div>
          <div className="flex items-center">
            <Clock className="mr-1 h-3.5 w-3.5" />
            {formatDate(job.publishedAt ?? job.createdAt)}
          </div>
          <div className="flex items-center">
            <DollarSign className="mr-1 h-3.5 w-3.5" />
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/jobs/${job.slug}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
