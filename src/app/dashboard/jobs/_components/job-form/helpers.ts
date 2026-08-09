import type { JobPostingDto } from "@/types/jobs.types";
import type { JobPostingFormValues } from "@/lib/validation/job.validation";

export function toFormState(initialData?: JobPostingDto): JobPostingFormValues {
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

export function buildPayload(formData: JobPostingFormValues): Record<string, unknown> {
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
}
