"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Job } from "../_data/mock-jobs";
import { Label } from "@/components/ui/label";
import { logger } from "@/lib/logger";

interface JobFormProps {
  initialData?: Job;
  mode: "create" | "edit";
}

export function JobForm({ initialData, mode }: JobFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Simple state management for the prototype
  const [formData, setFormData] = useState<Partial<Job>>(
    initialData || {
      title: "",
      company: "",
      location: "",
      type: "Full-time",
      status: "Draft",
      salary: "",
      description: "",
      // Defaults
      applicants: 0,
      postedDate: new Date().toISOString().split("T")[0],
    },
  );

  const handleChange = (field: keyof Job, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info("Form submitted", formData);
    setLoading(false);
    router.push("/dashboard/jobs");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Post a New Job" : "Edit Job Posting"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Fill in the details below to create a new job posting."
              : "Update the job details below."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Developer"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="e.g. Acme Corp"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Remote, New York, NY"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Employment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input
                  id="salary"
                  placeholder="e.g. $100k - $120k"
                  value={formData.salary}
                  onChange={(e) => handleChange("salary", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role, responsibilities, and requirements..."
                className="min-h-[200px]"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create Job" : "Update Job"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
