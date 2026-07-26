"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { EventType, EventStatus, Event } from "@/types/event.types";
import { EventLayout } from "@/components/events/event-layout";
import { getEventById } from "@/lib/services/event.service";
import { logger } from "@/lib/logger";

const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

const statusOptions = [
  { value: EventStatus.DRAFT, label: "Draft" },
  { value: EventStatus.PUBLISHED, label: "Published" },
  { value: EventStatus.CANCELLED, label: "Cancelled" },
  { value: EventStatus.COMPLETED, label: "Completed" },
];

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = React.useState<Event | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    shortDescription: "",
    eventType: EventType.WORKSHOP,
    status: EventStatus.DRAFT,
    startDate: "",
    endDate: "",
    location: "",
    virtualEventUrl: "",
    isVirtual: false,
    isInPerson: true,
    maxAttendees: "",
    registrationDeadline: "",
  });

  React.useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        const response = await getEventById(eventId);
        const eventData = response.event;

        setEvent(eventData);
        setTags(eventData.tags);

        // Format dates for input fields
        const formatDateForInput = (date: Date) => {
          return new Date(date).toISOString().slice(0, 16);
        };

        setFormData({
          title: eventData.title,
          description: eventData.description,
          shortDescription: eventData.shortDescription || "",
          eventType: eventData.eventType,
          status: eventData.status,
          startDate: formatDateForInput(eventData.startDate),
          endDate: formatDateForInput(eventData.endDate),
          location: eventData.location,
          virtualEventUrl: eventData.virtualEventUrl || "",
          isVirtual: eventData.isVirtual,
          isInPerson: eventData.isInPerson,
          maxAttendees: eventData.maxAttendees?.toString() || "",
          registrationDeadline: eventData.registrationDeadline
            ? formatDateForInput(eventData.registrationDeadline)
            : "",
        });
      } catch (error) {
        logger.error("Error fetching event data", error);
        router.push("/events");
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically call your API to update the event
      logger.info("Updating event with data", { ...formData, tags });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to event details page
      router.push(`/events/${eventId}`);
    } catch (error) {
      logger.error("Error updating event", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground/90 mb-2">Event Not Found</h1>
        <p className="text-foreground/60 mb-6">
          The event you're trying to edit doesn't exist or has been removed.
        </p>
        <Button onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <EventLayout event={event} showActions={false}>
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground/90">Basic Information</h3>

                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(value) => handleSelectChange("eventType", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground/90">Date and Time</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date and Time</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date and Time</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    name="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground/90">Location</h3>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      id="isInPerson"
                      name="isInPerson"
                      type="checkbox"
                      checked={formData.isInPerson}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                    />
                    <Label htmlFor="isInPerson" className="ml-2">
                      In-Person Event
                    </Label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isVirtual"
                      name="isVirtual"
                      type="checkbox"
                      checked={formData.isVirtual}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                    />
                    <Label htmlFor="isVirtual" className="ml-2">
                      Virtual Event
                    </Label>
                  </div>
                </div>

                {formData.isVirtual && (
                  <div>
                    <Label htmlFor="virtualEventUrl">Virtual Event URL</Label>
                    <Input
                      id="virtualEventUrl"
                      name="virtualEventUrl"
                      value={formData.virtualEventUrl}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground/90">Capacity</h3>

                <div>
                  <Label htmlFor="maxAttendees">Maximum Attendees (Optional)</Label>
                  <Input
                    id="maxAttendees"
                    name="maxAttendees"
                    type="number"
                    min="1"
                    value={formData.maxAttendees}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground/90">Tags</h3>

                <div>
                  <Label htmlFor="tags">Add Tags</Label>
                  <div className="flex mt-1">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="Add a tag..."
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline" className="ml-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-foreground/50 hover:text-foreground/70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={handleGoBack}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </EventLayout>
  );
}
