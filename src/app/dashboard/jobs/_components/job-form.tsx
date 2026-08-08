"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type EmploymentType,
  type ExperienceLevel,
  type JobBoardMeta,
  type JobPostingDto,
  type JobStatus,
} from "@/types/jobs.types";
import { createJobPosting, updateJobPosting } from "../_lib/jobs-api";

interface JobFormProps {
  initialData?: JobPostingDto;
  meta: JobBoardMeta;
  mode: "create" | "edit";
}

interface JobFormState {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  categoryId: string;
  typeId: string;
  locationId: string;
  companyId: string;
  status: JobStatus;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  isRemote: boolean;
  isFeatured: boolean;
  applicationDeadline: string;
  tags: string;
}

function toFormState(initialData?: JobPostingDto): JobFormState {
  if (!initialData) {
    return {
      title: "",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      categoryId: "",
      typeId: "",
      locationId: "",
      companyId: "",
      status: "DRAFT",
      employmentType: "FULL_TIME",
      experienceLevel: "MID_LEVEL",
      salaryMin: "",
      salaryMax: "",
      currency: "USD",
      isRemote: false,
      isFeatured: false,
      applicationDeadline: "",
      tags: "",
    };
  }

  return {
    title: initialData.title,
    description: initialData.description,
    requirements: initialData.requirements ?? "",
    responsibilities: initialData.responsibilities ?? "",
    benefits: initialData.benefits ?? "",
    categoryId: initialData.categoryId,
    typeId: initialData.typeId,
    locationId: initialData.locationId,
    companyId: initialData.companyId,
    status: initialData.status,
    employmentType: initialData.employmentType,
    experienceLevel: initialData.experienceLevel,
    salaryMin: initialData.salaryMin !== null ? String(initialData.salaryMin) : "",
    salaryMax: initialData.salaryMax !== null ? String(initialData.salaryMax) : "",
    currency: initialData.currency,
    isRemote: initialData.isRemote,
    isFeatured: initialData.isFeatured,
    applicationDeadline: initialData.applicationDeadline
      ? initialData.applicationDeadline.slice(0, 10)
      : "",
    tags: initialData.tags.join(", "),
  };
}

export function JobForm({ initialData, meta, mode }: JobFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormState>(() => toFormState(initialData));

  const setField = <K extends keyof JobFormState>(field: K, value: JobFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      typeId: formData.typeId,
      locationId: formData.locationId,
      companyId: formData.companyId,
      status: formData.status,
      employmentType: formData.employmentType,
      experienceLevel: formData.experienceLevel,
      currency: formData.currency,
      isRemote: formData.isRemote,
      isFeatured: formData.isFeatured,
    };
    if (formData.requirements) payload.requirements = formData.requirements;
    if (formData.responsibilities) payload.responsibilities = formData.responsibilities;
    if (formData.benefits) payload.benefits = formData.benefits;
    if (formData.salaryMin !== "") payload.salaryMin = Number(formData.salaryMin);
    if (formData.salaryMax !== "") payload.salaryMax = Number(formData.salaryMax);
    if (formData.applicationDeadline) {
      payload.applicationDeadline = new Date(formData.applicationDeadline).toISOString();
    }
    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tags.length > 0) payload.tags = tags;
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = buildPayload();
      if (mode === "create") {
        await createJobPosting(payload);
      } else if (initialData) {
        await updateJobPosting(initialData.id, payload);
      }
      router.push("/dashboard/jobs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the job posting");
      setLoading(false);
    }
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
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Developer"
                value={formData.title}
                onChange={(e) => setField("title", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Select
                  value={formData.companyId}
                  onValueChange={(value) => setField("companyId", value)}
                >
                  <SelectTrigger id="company">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setField("locationId", value)}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Job Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setField("categoryId", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type</Label>
                <Select
                  value={formData.typeId}
                  onValueChange={(value) => setField("typeId", value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => setField("employmentType", value as EmploymentType)}
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {EMPLOYMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) => setField("experienceLevel", value as ExperienceLevel)}
                >
                  <SelectTrigger id="experienceLevel">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {EXPERIENCE_LEVEL_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Salary Min</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 60000"
                  value={formData.salaryMin}
                  onChange={(e) => setField("salaryMin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Salary Max</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 80000"
                  value={formData.salaryMax}
                  onChange={(e) => setField("salaryMax", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  maxLength={3}
                  placeholder="USD"
                  value={formData.currency}
                  onChange={(e) => setField("currency", e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setField("status", value as JobStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {JOB_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => setField("applicationDeadline", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isRemote"
                  checked={formData.isRemote}
                  onCheckedChange={(checked) => setField("isRemote", checked === true)}
                />
                <Label htmlFor="isRemote" className="font-normal">
                  Remote friendly
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setField("isFeatured", checked === true)}
                />
                <Label htmlFor="isFeatured" className="font-normal">
                  Feature on the public job board
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="e.g. react, typescript, remote"
                value={formData.tags}
                onChange={(e) => setField("tags", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role..."
                className="min-h-[160px]"
                value={formData.description}
                onChange={(e) => setField("description", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="What candidates should bring..."
                className="min-h-[120px]"
                value={formData.requirements}
                onChange={(e) => setField("requirements", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                placeholder="What the role will own..."
                className="min-h-[120px]"
                value={formData.responsibilities}
                onChange={(e) => setField("responsibilities", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea
                id="benefits"
                placeholder="Perks and benefits..."
                className="min-h-[120px]"
                value={formData.benefits}
                onChange={(e) => setField("benefits", e.target.value)}
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
