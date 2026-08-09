"use client";

import { QrCheckInCard } from "./qr-check-in-card";
import { RegistrationSearchCard } from "./registration-search-card";
import type { EventCheckInProps } from "./types";

export function EventCheckIn({
  event,
  onCheckIn,
  onSearchRegistration,
  isSubmitting = false,
  searchResults = [],
  className = "",
}: EventCheckInProps) {
  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QrCheckInCard eventId={event.id} onCheckIn={onCheckIn} isSubmitting={isSubmitting} />
        <RegistrationSearchCard
          event={event}
          onCheckIn={onCheckIn}
          onSearchRegistration={onSearchRegistration}
          isSubmitting={isSubmitting}
          searchResults={searchResults}
        />
      </div>
    </div>
  );
}
