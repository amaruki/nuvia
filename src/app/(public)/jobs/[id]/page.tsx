"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, ArrowLeft, Share2, Globe } from "lucide-react";
import { jobs } from "@/app/dashboard/jobs/_data/mock-jobs";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Job not found</h1>
        <Button onClick={() => router.push("/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-6 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/jobs")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all jobs
          </Button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{job.title}</h1>
              <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{job.company}</span>
                <span>•</span>
                <span>{job.location}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-100 border-0"
                >
                  {job.type}
                </Badge>
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-100 border-0"
                >
                  {job.salary}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  Posted {job.postedDate}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button size="lg" className="w-full md:w-auto">
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="prose prose-slate max-w-none">
            <h3 className="text-xl font-semibold mb-4">About the Role</h3>
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
              {job.description}
            </p>

            {/* Adding some mock content for sections that might not be in the simple data model yet */}
            <h3 className="text-xl font-semibold mt-8 mb-4">Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                Collaborate with cross-functional teams to define, design, and ship new features.
              </li>
              <li>
                Unit-test code for robustness, including edge cases, usability, and general
                reliability.
              </li>
              <li>Work on bug fixing and improving application performance.</li>
              <li>
                Continuously discover, evaluate, and implement new technologies to maximize
                development efficiency.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-4">Requirements</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>BS/MS degree in Computer Science, Engineering or a related subject.</li>
              <li>
                Proven software development experience and solid experience with modern frameworks.
              </li>
              <li>Experience with third-party libraries and APIs.</li>
              <li>
                Working knowledge of the general mobile landscape, architectures, trends, and
                emerging technologies.
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-xl p-6 bg-card">
            <h3 className="font-semibold mb-4">Job Overview</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{job.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Job Type</p>
                  <p className="text-sm text-muted-foreground">{job.type}</p>
                </div>
              </div>
              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Salary</p>
                  <p className="text-sm text-muted-foreground">{job.salary}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Globe className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Visit website
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-6 bg-muted/20">
            <h3 className="font-semibold mb-2">About {job.company}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {job.company} is a leading innovator in the industry, committed to building products
              that make a difference.
            </p>
            <Button variant="link" className="px-0">
              View Company Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
