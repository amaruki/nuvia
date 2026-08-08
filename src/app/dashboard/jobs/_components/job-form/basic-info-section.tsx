import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobBoardMeta } from "@/types/jobs.types";
import type { JobFormState, SetJobFormField } from "./types";

interface BasicInfoSectionProps {
  formData: JobFormState;
  setField: SetJobFormField;
  meta: JobBoardMeta;
}

export function BasicInfoSection({ formData, setField, meta }: BasicInfoSectionProps) {
  return (
    <>
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
          <Select value={formData.typeId} onValueChange={(value) => setField("typeId", value)}>
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
    </>
  );
}
