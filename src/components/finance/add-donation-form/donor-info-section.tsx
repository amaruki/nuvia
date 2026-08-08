import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, User, UserX } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { DonationFormData } from "@/types/finance";
import type { DonorInfo } from "./types";

interface DonorInfoSectionProps {
  formData: DonationFormData;
  setFormData: Dispatch<SetStateAction<DonationFormData>>;
  donorInfo: DonorInfo;
  setDonorInfo: Dispatch<SetStateAction<DonorInfo>>;
}

export function DonorInfoSection({
  formData,
  setFormData,
  donorInfo,
  setDonorInfo,
}: DonorInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Donor Information</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="donorType">Donor Type</Label>
          <Select
            value={formData.donorType}
            onValueChange={(value: "individual" | "organization" | "anonymous") =>
              setFormData((prev) => ({ ...prev, donorType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select donor type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Individual
                </div>
              </SelectItem>
              <SelectItem value="organization">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organization
                </div>
              </SelectItem>
              <SelectItem value="anonymous">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Anonymous
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.donorType !== "anonymous" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="donorName">Donor Name</Label>
              <Input
                id="donorName"
                placeholder="Enter donor name"
                value={donorInfo.name}
                onChange={(e) => setDonorInfo((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorEmail">Email Address</Label>
              <Input
                id="donorEmail"
                type="email"
                placeholder="Enter email address"
                value={donorInfo.email}
                onChange={(e) => setDonorInfo((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </>
        )}

        {formData.donorType === "anonymous" && (
          <div className="space-y-2">
            <Label htmlFor="anonymousEmail">Contact Email (Optional)</Label>
            <Input
              id="anonymousEmail"
              type="email"
              placeholder="anonymous@example.com"
              value={donorInfo.email}
              onChange={(e) => setDonorInfo((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
