"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, Plus, Trash2, Eye, EyeOff, Megaphone, Calendar as CalendarLucide, Shield, Settings, Star, Lock, Bell, Gift, AlertTriangle, Layout, Users, Building, Users2, Crown, ShieldCheck, Award, UserCheck, Globe, ArrowDown, Minus, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { 
  ANNOUNCEMENT_TYPES, 
  ANNOUNCEMENT_PRIORITIES, 
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TYPE_DISPLAY,
  ANNOUNCEMENT_PRIORITY_DISPLAY,
  ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY,
  type AnnouncementFormData,
  type AnnouncementFormValues,
  type Attachment
} from "@/types/announcement.types";

// Form validation schema
const announcementFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(ANNOUNCEMENT_TYPES),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES),
  targetAudience: z.enum(ANNOUNCEMENT_TARGET_AUDIENCES),
  status: z.enum(["draft", "published", "scheduled", "review", "archived"]),
  authorId: z.string().min(1, "Author is required"),
  tagIds: z.array(z.string()).default([]),
  featuredImage: z.string().optional(),
  expiresAt: z.date().optional(),
  isPinned: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  requiresAcknowledgment: z.boolean().default(false),
  sendEmailNotification: z.boolean().default(false),
  sendPushNotification: z.boolean().default(false),
  displayOnHomepage: z.boolean().default(false),
  displayInDashboard: z.boolean().default(false),
  visibility: z.enum(["public", "members_only", "premium_only", "chapter_only", "committee_only"] as const),
  allowedRoles: z.array(z.string()).default([]),
  allowedChapters: z.array(z.string()).default([]),
  allowedCommittees: z.array(z.string()).default([]),
  commentsEnabled: z.boolean().default(false),
  sharingEnabled: z.boolean().default(true),
  downloadEnabled: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

interface AddAnnouncementFormProps {
  initialData?: Partial<AnnouncementFormValues>;
  onSubmit: (data: AnnouncementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddAnnouncementForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: AddAnnouncementFormProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachment, setNewAttachment] = useState({ name: "", url: "", type: "document" as const });
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      type: "general",
      priority: "medium",
      targetAudience: "all_members",
      status: "draft" as const,
      authorId: "",
      tagIds: [],
      featuredImage: "",
      expiresAt: undefined,
      isPinned: false,
      isUrgent: false,
      requiresAcknowledgment: false,
      sendEmailNotification: false,
      sendPushNotification: false,
      displayOnHomepage: true,
      displayInDashboard: true,
      visibility: "public" as const,
      allowedRoles: [],
      allowedChapters: [],
      allowedCommittees: [],
      commentsEnabled: false,
      sharingEnabled: true,
      downloadEnabled: false,
      isFeatured: false,
      ...initialData,
    },
  });

  const handleSubmit = (values: AnnouncementFormValues) => {
    const formData: AnnouncementFormData = {
      ...values,
      category: "announcements", // Always announcements
      attachments: attachments.length > 0 ? attachments.map(att => ({
        id: att.id,
        name: att.name,
        url: att.url,
        size: 0, // Default size since we don't have it
        type: att.type
      })) : undefined,
    };
    onSubmit(formData);
  };

  const addAttachment = () => {
    if (newAttachment.name && newAttachment.url) {
      setAttachments([...attachments, { ...newAttachment, id: Date.now().toString() }]);
      setNewAttachment({ name: "", url: "", type: "document" });
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const { watch } = form;
  const formValues = watch();
  const selectedType = formValues.type;
  const selectedPriority = formValues.priority;
  const selectedAudience = formValues.targetAudience;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
          <CardDescription>
            Create a new announcement for your organization members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter announcement title"
                      {...form.register("title")}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select 
                      value={selectedType} 
                      onValueChange={(value) => form.setValue("type", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select announcement type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANNOUNCEMENT_TYPES.map((type) => {
                          const iconMap = {
                          general: Megaphone,
                          event: CalendarLucide,
                            policy: Shield,
                            maintenance: Settings,
                            feature: Star,
                            security: Lock,
                            reminder: Bell,
                            celebration: Gift,
                            emergency: AlertTriangle,
                            banner: Layout
                          };
                          const IconComponent = iconMap[type as keyof typeof iconMap];
                          
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                {IconComponent && <IconComponent className="h-4 w-4" />}
                                <span>{ANNOUNCEMENT_TYPE_DISPLAY[type].name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt *</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief summary of the announcement"
                    rows={3}
                    {...form.register("excerpt")}
                  />
                  {form.formState.errors.excerpt && (
                    <p className="text-sm text-red-500">{form.formState.errors.excerpt.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Full announcement content"
                    rows={8}
                    {...form.register("content")}
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={selectedPriority} 
                      onValueChange={(value) => form.setValue("priority", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANNOUNCEMENT_PRIORITIES.map((priority) => {
                          const priorityIconMap = {
                            low: ArrowDown,
                            medium: Minus,
                            high: ArrowUp,
                            urgent: AlertTriangle
                          };
                          const PriorityIconComponent = priorityIconMap[priority as keyof typeof priorityIconMap];
                          
                          return (
                            <SelectItem key={priority} value={priority}>
                              <div className="flex items-center gap-2">
                                {PriorityIconComponent && <PriorityIconComponent className="h-4 w-4" />}
                                <span>{ANNOUNCEMENT_PRIORITY_DISPLAY[priority].name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select 
                      value={selectedAudience} 
                      onValueChange={(value) => form.setValue("targetAudience", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANNOUNCEMENT_TARGET_AUDIENCES.map((audience) => {
                          const audienceIconMap = {
                            all_members: Users,
                            specific_chapters: Building,
                            specific_committees: Users2,
                            premium_members: Crown,
                            chapter_admins: ShieldCheck,
                            committee_chairs: Award,
                            staff_only: UserCheck,
                            public: Globe
                          };
                          const AudienceIconComponent = audienceIconMap[audience as keyof typeof audienceIconMap];
                          
                          return (
                            <SelectItem key={audience} value={audience}>
                              <div className="flex items-center gap-2">
                                {AudienceIconComponent && <AudienceIconComponent className="h-4 w-4" />}
                                <span>{ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[audience].name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formValues.expiresAt && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formValues.expiresAt ? format(formValues.expiresAt, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formValues.expiresAt}
                          onSelect={(date) => form.setValue("expiresAt", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formValues.status} 
                      onValueChange={(value) => form.setValue("status", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Under Review</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select 
                      value={formValues.visibility} 
                      onValueChange={(value) => form.setValue("visibility", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="members_only">Members Only</SelectItem>
                        <SelectItem value="premium_only">Premium Members</SelectItem>
                        <SelectItem value="chapter_only">Chapter Members</SelectItem>
                        <SelectItem value="committee_only">Committee Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPinned"
                      checked={formValues.isPinned}
                      onCheckedChange={(checked) => form.setValue("isPinned", checked as boolean)}
                    />
                    <Label htmlFor="isPinned">Pin to top</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isUrgent"
                      checked={formValues.isUrgent}
                      onCheckedChange={(checked) => form.setValue("isUrgent", checked as boolean)}
                    />
                    <Label htmlFor="isUrgent">Mark as urgent</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresAcknowledgment"
                      checked={formValues.requiresAcknowledgment}
                      onCheckedChange={(checked) => form.setValue("requiresAcknowledgment", checked as boolean)}
                    />
                    <Label htmlFor="requiresAcknowledgment">Require acknowledgment</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFeatured"
                      checked={formValues.isFeatured}
                      onCheckedChange={(checked) => form.setValue("isFeatured", checked as boolean)}
                    />
                    <Label htmlFor="isFeatured">Feature announcement</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="display" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Notification Settings</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendEmailNotification"
                      checked={formValues.sendEmailNotification}
                      onCheckedChange={(checked) => form.setValue("sendEmailNotification", checked as boolean)}
                    />
                    <Label htmlFor="sendEmailNotification">Send email notification</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendPushNotification"
                      checked={formValues.sendPushNotification}
                      onCheckedChange={(checked) => form.setValue("sendPushNotification", checked as boolean)}
                    />
                    <Label htmlFor="sendPushNotification">Send push notification</Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Display Options</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="displayOnHomepage"
                      checked={formValues.displayOnHomepage}
                      onCheckedChange={(checked) => form.setValue("displayOnHomepage", checked as boolean)}
                    />
                    <Label htmlFor="displayOnHomepage">Display on homepage</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="displayInDashboard"
                      checked={formValues.displayInDashboard}
                      onCheckedChange={(checked) => form.setValue("displayInDashboard", checked as boolean)}
                    />
                    <Label htmlFor="displayInDashboard">Display in dashboard</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="commentsEnabled"
                      checked={formValues.commentsEnabled}
                      onCheckedChange={(checked) => form.setValue("commentsEnabled", checked as boolean)}
                    />
                    <Label htmlFor="commentsEnabled">Enable comments</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sharingEnabled"
                      checked={formValues.sharingEnabled}
                      onCheckedChange={(checked) => form.setValue("sharingEnabled", checked as boolean)}
                    />
                    <Label htmlFor="sharingEnabled">Enable sharing</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="downloadEnabled"
                      checked={formValues.downloadEnabled}
                      onCheckedChange={(checked) => form.setValue("downloadEnabled", checked as boolean)}
                    />
                    <Label htmlFor="downloadEnabled">Enable download</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Attachment name"
                      value={newAttachment.name}
                      onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                    />
                    <Input
                      placeholder="Attachment URL"
                      value={newAttachment.url}
                      onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                    />
                    <Button type="button" onClick={addAttachment} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Current Attachments</Label>
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{attachment.type}</Badge>
                              <span className="text-sm">{attachment.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(attachment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Announcement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}