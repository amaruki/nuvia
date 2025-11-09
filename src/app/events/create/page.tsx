"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { EventType, EventStatus } from "@/types/event.types";
import { EventLayout } from "@/components/events/event-layout";

const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    shortDescription: "",
    eventType: EventType.WORKSHOP,
    startDate: "",
    endDate: "",
    location: "",
    virtualEventUrl: "",
    isVirtual: false,
    isInPerson: true,
    maxAttendees: "",
    registrationDeadline: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
      // Here you would typically call your API to create the event
      console.log("Creating event with data:", { ...formData, tags });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to events page
      router.push("/events");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <EventLayout
      event={{
        id: "new",
        title: "Create New Event",
        description: "",
        eventType: EventType.WORKSHOP,
        status: EventStatus.DRAFT,
        startDate: new Date(),
        endDate: new Date(),
        location: "",
        isVirtual: false,
        isInPerson: true,
        currentAttendees: 0,
        organizerId: "",
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }}
      showActions={false}
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Event</CardTitle>
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
                
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <select
                    id="eventType"
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input focus:outline-none focus:ring-ring focus:border-primary sm:text-sm rounded-md"
                  >
                    {eventTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      variant="outline"
                      className="ml-2"
                    >
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoBack}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Event
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