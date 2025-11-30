"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CommitteeFormData,
  CommitteeStatus,
  CommitteeType,
  CommitteeAuthorityLevel 
} from "@/types/committee.types";
import { X, Plus, Trash2 } from "lucide-react";

const committeeFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
  displayName: z.string().min(3, "Display name must be at least 3 characters").max(100, "Display name must be less than 100 characters"),
  description: z.string().optional(),
  purpose: z.string().min(10, "Purpose must be at least 10 characters").max(500, "Purpose must be less than 500 characters"),
  status: z.enum(["active", "inactive", "pending", "suspended"] as const),
  type: z.enum(["executive", "functional", "special_interest", "ad_hoc", "standing"] as const),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    meetingLocation: z.string().optional(),
    virtualMeetingLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
  }),
  charter: z.object({
    missionStatement: z.string().min(10, "Mission statement must be at least 10 characters").max(500, "Mission statement must be less than 500 characters"),
    responsibilities: z.array(z.string().min(5, "Each responsibility must be at least 5 characters")).min(1, "At least one responsibility is required"),
    authorityLevel: z.enum(["advisory", "operational", "strategic", "executive"] as const),
    decisionMakingProcess: z.string().min(10, "Decision making process must be at least 10 characters").max(500, "Decision making process must be less than 500 characters"),
    reportingStructure: z.string().min(10, "Reporting structure must be at least 10 characters").max(500, "Reporting structure must be less than 500 characters"),
    termLimits: z.object({
      chairTerm: z.number().min(1, "Chair term must be at least 1 month").max(60, "Chair term must be less than 60 months"),
      memberTerm: z.number().min(1, "Member term must be at least 1 month").max(60, "Member term must be less than 60 months"),
      maxTerms: z.number().min(1, "Max terms must be at least 1").max(10, "Max terms must be less than 10"),
    }).optional(),
  }),
  parentCommitteeId: z.string().optional(),
});

type CommitteeFormValues = z.infer<typeof committeeFormSchema>;

interface AddCommitteeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CommitteeFormData) => Promise<void>;
  initialData?: Partial<CommitteeFormData>;
  isEditing?: boolean;
}

export function AddCommitteeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: AddCommitteeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newResponsibility, setNewResponsibility] = useState("");

  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      purpose: "",
      status: "pending",
      type: "functional",
      contactInfo: {
        email: "",
        phone: "",
        meetingLocation: "",
        virtualMeetingLink: "",
        website: "",
      },
      charter: {
        missionStatement: "",
        responsibilities: [],
        authorityLevel: "operational",
        decisionMakingProcess: "",
        reportingStructure: "",
        termLimits: {
          chairTerm: 24,
          memberTerm: 24,
          maxTerms: 2,
        },
      },
      parentCommitteeId: "",
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form.reset]);

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      const currentResponsibilities = form.getValues("charter.responsibilities") || [];
      form.setValue("charter.responsibilities", [...currentResponsibilities, newResponsibility.trim()]);
      setNewResponsibility("");
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    const currentResponsibilities = form.getValues("charter.responsibilities") || [];
    form.setValue("charter.responsibilities", currentResponsibilities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: CommitteeFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values as CommitteeFormData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting committee form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: CommitteeStatus; label: string; description: string }[] = [
    { value: "active", label: "Active", description: "Fully operational committee" },
    { value: "inactive", label: "Inactive", description: "Temporarily suspended" },
    { value: "pending", label: "Pending", description: "Awaiting approval" },
    { value: "suspended", label: "Suspended", description: "Under review" },
  ];

  const typeOptions: { value: CommitteeType; label: string; description: string }[] = [
    { value: "executive", label: "Executive", description: "Strategic decision-making" },
    { value: "functional", label: "Functional", description: "Ongoing operational focus" },
    { value: "special_interest", label: "Special Interest", description: "Specific topic focus" },
    { value: "ad_hoc", label: "Ad Hoc", description: "Temporary purpose" },
    { value: "standing", label: "Standing", description: "Permanent committee" },
  ];

  const authorityOptions: { value: CommitteeAuthorityLevel; label: string; description: string }[] = [
    { value: "advisory", label: "Advisory", description: "Recommendations only" },
    { value: "operational", label: "Operational", description: "Day-to-day decisions" },
    { value: "strategic", label: "Strategic", description: "Long-term planning" },
    { value: "executive", label: "Executive", description: "Full authority" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Committee" : "Create New Committee"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the committee information and charter details."
              : "Fill in the committee details and establish the charter."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Committee Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., finance_committee"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., Finance Committee"
                    {...form.register("displayName")}
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the committee's role and focus..."
                  rows={3}
                  {...form.register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="Clear statement of the committee's purpose and objectives..."
                  rows={3}
                  {...form.register("purpose")}
                />
                {form.formState.errors.purpose && (
                  <p className="text-sm text-destructive">{form.formState.errors.purpose.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as CommitteeStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Committee Type</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value as CommitteeType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="committee@org.org"
                    {...form.register("contactInfo.email")}
                  />
                  {form.formState.errors.contactInfo?.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.contactInfo.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    {...form.register("contactInfo.phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingLocation">Meeting Location</Label>
                <Input
                  id="meetingLocation"
                  placeholder="Conference Room A, Headquarters"
                  {...form.register("contactInfo.meetingLocation")}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="virtualMeetingLink">Virtual Meeting Link</Label>
                  <Input
                    id="virtualMeetingLink"
                    placeholder="https://zoom.us/j/committee"
                    {...form.register("contactInfo.virtualMeetingLink")}
                  />
                  {form.formState.errors.contactInfo?.virtualMeetingLink && (
                    <p className="text-sm text-destructive">{form.formState.errors.contactInfo.virtualMeetingLink.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://org.org/committees/finance"
                    {...form.register("contactInfo.website")}
                  />
                  {form.formState.errors.contactInfo?.website && (
                    <p className="text-sm text-destructive">{form.formState.errors.contactInfo.website.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Committee Charter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Committee Charter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="missionStatement">Mission Statement</Label>
                <Textarea
                  id="missionStatement"
                  placeholder="Clear statement of the committee's mission and purpose..."
                  rows={3}
                  {...form.register("charter.missionStatement")}
                />
                {form.formState.errors.charter?.missionStatement && (
                  <p className="text-sm text-destructive">{form.formState.errors.charter.missionStatement.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Responsibilities</Label>
                <div className="space-y-2">
                  {form.watch("charter.responsibilities")?.map((responsibility, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={responsibility}
                        onChange={(e) => {
                          const current = form.getValues("charter.responsibilities") || [];
                          current[index] = e.target.value;
                          form.setValue("charter.responsibilities", current);
                        }}
                        placeholder="Enter responsibility..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveResponsibility(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2">
                    <Input
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      placeholder="Add new responsibility..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddResponsibility();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddResponsibility}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {form.formState.errors.charter?.responsibilities && (
                  <p className="text-sm text-destructive">{form.formState.errors.charter.responsibilities.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorityLevel">Authority Level</Label>
                <Select
                  value={form.watch("charter.authorityLevel")}
                  onValueChange={(value) => form.setValue("charter.authorityLevel", value as CommitteeAuthorityLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select authority level" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decisionMakingProcess">Decision Making Process</Label>
                <Textarea
                  id="decisionMakingProcess"
                  placeholder="Describe how decisions are made within the committee..."
                  rows={3}
                  {...form.register("charter.decisionMakingProcess")}
                />
                {form.formState.errors.charter?.decisionMakingProcess && (
                  <p className="text-sm text-destructive">{form.formState.errors.charter.decisionMakingProcess.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportingStructure">Reporting Structure</Label>
                <Textarea
                  id="reportingStructure"
                  placeholder="Describe the committee's reporting structure..."
                  rows={3}
                  {...form.register("charter.reportingStructure")}
                />
                {form.formState.errors.charter?.reportingStructure && (
                  <p className="text-sm text-destructive">{form.formState.errors.charter.reportingStructure.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Term Limits (Optional)</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="chairTerm">Chair Term (months)</Label>
                    <Input
                      id="chairTerm"
                      type="number"
                      placeholder="24"
                      {...form.register("charter.termLimits.chairTerm", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberTerm">Member Term (months)</Label>
                    <Input
                      id="memberTerm"
                      type="number"
                      placeholder="24"
                      {...form.register("charter.termLimits.memberTerm", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTerms">Maximum Terms</Label>
                    <Input
                      id="maxTerms"
                      type="number"
                      placeholder="2"
                      {...form.register("charter.termLimits.maxTerms", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Committee" : "Create Committee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}