"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { logger } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ChapterFormData,
  ChapterStatus,
  ChapterLocation,
  ChapterContactInfo,
  ChapterSocialMedia,
  ChapterSettings,
} from "@/types/chapter.types";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  CreditCard,
  Settings,
  Plus,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

const chapterFormSchema = z.object({
  name: z
    .string()
    .min(3, "Chapter name must be at least 3 characters")
    .max(50, "Chapter name must be less than 50 characters"),
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(100, "Display name must be less than 100 characters"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  location: z.object({
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State must be at least 2 characters"),
    country: z.string().min(2, "Country must be at least 2 characters"),
    postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
    timezone: z.string().min(1, "Timezone is required"),
    region: z.string().min(2, "Region must be at least 2 characters"),
  }),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    address: z.string().min(5, "Address must be at least 5 characters"),
    mailingAddress: z.string().optional(),
  }),
  socialMedia: z.object({
    facebook: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
    instagram: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
    youtube: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
  }),
  settings: z.object({
    allowOnlineRegistration: z.boolean(),
    requireApproval: z.boolean(),
    membershipDues: z.number().min(0, "Membership dues must be a positive number"),
    meetingFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
    meetingDay: z.string().optional(),
    meetingTime: z.string().optional(),
    autoRenewMembership: z.boolean(),
    sendReminders: z.boolean(),
    publicDirectory: z.boolean(),
  }),
  parentChapterId: z.string().optional(),
});

type ChapterFormValues = z.infer<typeof chapterFormSchema>;

interface AddChapterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ChapterFormData) => Promise<void>;
  initialData?: ChapterFormData;
  isEditing?: boolean;
}

const statusOptions: { value: ChapterStatus; label: string; description: string }[] = [
  { value: "active", label: "Active", description: "Chapter is fully operational" },
  { value: "inactive", label: "Inactive", description: "Chapter is temporarily suspended" },
  { value: "pending", label: "Pending", description: "Chapter is awaiting approval" },
  { value: "suspended", label: "Suspended", description: "Chapter is suspended due to violations" },
];

const meetingFrequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

export function AddChapterForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: AddChapterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: initialData || {
      name: "",
      displayName: "",
      description: "",
      status: "pending",
      location: {
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        timezone: "America/New_York",
        region: "",
      },
      contactInfo: {
        email: "",
        phone: "",
        website: "",
        address: "",
        mailingAddress: "",
      },
      socialMedia: {
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        youtube: "",
      },
      settings: {
        allowOnlineRegistration: true,
        requireApproval: false,
        membershipDues: 100,
        meetingFrequency: "monthly",
        meetingDay: "",
        meetingTime: "",
        autoRenewMembership: true,
        sendReminders: true,
        publicDirectory: true,
      },
      parentChapterId: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const handleSubmit = async (values: ChapterFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      logger.error("Error submitting chapter form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyAddressToContact = () => {
    const locationAddress = form.getValues("location.address");
    form.setValue("contactInfo.address", locationAddress);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? "Edit Chapter" : "Create New Chapter"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Chapter Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., new_york_chapter"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., New York Chapter"
                    {...form.register("displayName")}
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.displayName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the chapter's purpose and focus..."
                  rows={3}
                  {...form.register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as ChapterStatus)}
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
                {form.formState.errors.status && (
                  <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    {...form.register("location.address")}
                  />
                  {form.formState.errors.location?.address && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" placeholder="New York" {...form.register("location.city")} />
                  {form.formState.errors.location?.city && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Input id="state" placeholder="NY" {...form.register("location.state")} />
                  {form.formState.errors.location?.state && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.state.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="United States"
                    {...form.register("location.country")}
                  />
                  {form.formState.errors.location?.country && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.country.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    placeholder="10001"
                    {...form.register("location.postalCode")}
                  />
                  {form.formState.errors.location?.postalCode && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.postalCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Input
                    id="region"
                    placeholder="Northeast"
                    {...form.register("location.region")}
                  />
                  {form.formState.errors.location?.region && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.location.region.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone *</Label>
                <Select
                  value={form.watch("location.timezone")}
                  onValueChange={(value) => form.setValue("location.timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.location?.timezone && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.location.timezone.message}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <Button type="button" variant="outline" size="sm" onClick={copyAddressToContact}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Copy from Location
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="chapter@example.org"
                      {...form.register("contactInfo.email")}
                    />
                    {form.formState.errors.contactInfo?.email && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.contactInfo.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+1 (555) 123-4567"
                      {...form.register("contactInfo.phone")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactWebsite">Website</Label>
                    <Input
                      id="contactWebsite"
                      placeholder="https://chapter.example.org"
                      {...form.register("contactInfo.website")}
                    />
                    {form.formState.errors.contactInfo?.website && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.contactInfo.website.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactAddress">Mailing Address</Label>
                    <Input
                      id="contactAddress"
                      placeholder="PO Box 123, City, State 12345"
                      {...form.register("contactInfo.mailingAddress")}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Social Media</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      placeholder="https://facebook.com/chapter"
                      {...form.register("socialMedia.facebook")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/chapter"
                      {...form.register("socialMedia.twitter")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/company/chapter"
                      {...form.register("socialMedia.linkedin")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="https://instagram.com/chapter"
                      {...form.register("socialMedia.instagram")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      placeholder="https://youtube.com/channel/chapter"
                      {...form.register("socialMedia.youtube")}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Membership Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="membershipDues">Annual Membership Dues ($) *</Label>
                    <Input
                      id="membershipDues"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="100"
                      {...form.register("settings.membershipDues", { valueAsNumber: true })}
                    />
                    {form.formState.errors.settings?.membershipDues && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.settings.membershipDues.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetingFrequency">Meeting Frequency *</Label>
                    <Select
                      value={form.watch("settings.meetingFrequency")}
                      onValueChange={(value) =>
                        form.setValue("settings.meetingFrequency", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {meetingFrequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetingDay">Meeting Day</Label>
                    <Input
                      id="meetingDay"
                      placeholder="Third Thursday"
                      {...form.register("settings.meetingDay")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetingTime">Meeting Time</Label>
                    <Input
                      id="meetingTime"
                      placeholder="6:00 PM"
                      {...form.register("settings.meetingTime")}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Chapter Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowOnlineRegistration">Allow Online Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable new members to register online
                      </p>
                    </div>
                    <Switch
                      id="allowOnlineRegistration"
                      checked={form.watch("settings.allowOnlineRegistration")}
                      onCheckedChange={(checked) =>
                        form.setValue("settings.allowOnlineRegistration", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireApproval">Require Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Require admin approval for new members
                      </p>
                    </div>
                    <Switch
                      id="requireApproval"
                      checked={form.watch("settings.requireApproval")}
                      onCheckedChange={(checked) =>
                        form.setValue("settings.requireApproval", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoRenewMembership">Auto-Renew Membership</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically renew memberships
                      </p>
                    </div>
                    <Switch
                      id="autoRenewMembership"
                      checked={form.watch("settings.autoRenewMembership")}
                      onCheckedChange={(checked) =>
                        form.setValue("settings.autoRenewMembership", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sendReminders">Send Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Send meeting and event reminders
                      </p>
                    </div>
                    <Switch
                      id="sendReminders"
                      checked={form.watch("settings.sendReminders")}
                      onCheckedChange={(checked) =>
                        form.setValue("settings.sendReminders", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="publicDirectory">Public Directory</Label>
                      <p className="text-sm text-muted-foreground">
                        List chapter in public directory
                      </p>
                    </div>
                    <Switch
                      id="publicDirectory"
                      checked={form.watch("settings.publicDirectory")}
                      onCheckedChange={(checked) =>
                        form.setValue("settings.publicDirectory", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Chapter" : "Create Chapter"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
