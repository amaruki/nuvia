"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle } from "lucide-react";
import { Event, EventRegistration } from "@/types/event";
import type { EventCheckInInput } from "@/lib/validation/event.validation";
import { RegistrationSearchResults } from "./registration-search-results";
import { SelectedRegistrationPanel } from "./selected-registration-panel";
import { formatDate, formatTime } from "./utils";

interface RegistrationSearchCardProps {
  event: Event;
  onCheckIn: (data: EventCheckInInput) => void;
  onSearchRegistration?: (searchTerm: string) => void;
  isSubmitting: boolean;
  searchResults: EventRegistration[];
}

export function RegistrationSearchCard({
  event,
  onCheckIn,
  onSearchRegistration,
  isSubmitting,
  searchResults,
}: RegistrationSearchCardProps) {
  const [selectedRegistration, setSelectedRegistration] = React.useState<EventRegistration | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearch = () => {
    if (searchTerm.trim() && onSearchRegistration) {
      onSearchRegistration(searchTerm.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Manual Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-2">
          <Input
            placeholder="Search by name, email, or registration ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
            Search
          </Button>
        </div>

        {/* Search Results */}
        <RegistrationSearchResults
          searchResults={searchResults}
          selectedRegistrationId={selectedRegistration?.id}
          onSelect={setSelectedRegistration}
        />

        {/* Selected Registration */}
        {selectedRegistration && (
          <SelectedRegistrationPanel
            registration={selectedRegistration}
            eventId={event.id}
            onCheckIn={onCheckIn}
            onDeselect={() => setSelectedRegistration(null)}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Event Information */}
        <div className="bg-info/10 border border-info/30 text-info p-4 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Event Information</p>
              <p className="text-sm mt-1">{event.title}</p>
              <p className="text-sm">
                {formatDate(event.startDate)} at {formatTime(event.startDate)}
              </p>
              <p className="text-sm">{event.location}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
