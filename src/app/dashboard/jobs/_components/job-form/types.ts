import type { JobBoardMeta, JobPostingDto } from "@/types/jobs.types";

export interface JobFormProps {
  initialData?: JobPostingDto;
  meta: JobBoardMeta;
  mode: "create" | "edit";
}
