"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import type { EventRegistration } from "@/types/event";
import { formatDate } from "./utils";

interface RegistrationSearchResultsProps {
  searchResults: EventRegistration[];
  selectedRegistrationId?: string;
  onSelect: (registration: EventRegistration) => void;
}

export function RegistrationSearchResults({
  searchResults,
  selectedRegistrationId,
  onSelect,
}: RegistrationSearchResultsProps) {
  if (searchResults.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      <p className="text-sm text-foreground/60">
        Found {searchResults.length} registration{searchResults.length !== 1 ? "s" : ""}
      </p>
      {searchResults.map((registration) => (
        <button
          key={registration.id}
          type="button"
          className={`w-full text-left p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedRegistrationId === registration.id
              ? "border-primary bg-primary/10"
              : "border-border hover:border-border"
          }`}
          aria-label={`Select registration for ${registration.user?.displayName || registration.user?.username || registration.user?.email || "attendee"}`}
          onClick={() => onSelect(registration)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-foreground/90">
                {registration.user?.displayName || registration.user?.username || "Attendee"}
              </p>
              <p className="text-sm text-foreground/60">{registration.user?.email}</p>
              <div className="flex items-center mt-1">
                <Badge
                  className={
                    registration.status === "confirmed"
                      ? "bg-chart-2/20 text-success"
                      : registration.status === "pending"
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                  }
                >
                  {registration.status}
                </Badge>
                {registration.checkedInAt && (
                  <Badge className="bg-info/20 text-info ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Checked In
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-foreground/50">
                Registered: {formatDate(registration.registeredAt)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
