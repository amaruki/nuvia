import type {
  EmploymentType,
  ExperienceLevel,
  JobBoardMeta,
  JobPostingDto,
  JobStatus,
} from "@/types/jobs.types";

export interface JobFormProps {
  initialData?: JobPostingDto;
  meta: JobBoardMeta;
  mode: "create" | "edit";
}

export interface JobFormState {
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

export type SetJobFormField = <K extends keyof JobFormState>(
  field: K,
  value: JobFormState[K],
) => void;
