"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Pin, Zap, Target, Clock, Mail, Smartphone, Home, Layout } from "lucide-react";
import type { FiltersControlProps } from "./types";

export function CheckboxFilters({ filters, onFiltersChange }: FiltersControlProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="pinned"
          checked={filters.isPinned === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ isPinned: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="pinned" className="text-sm flex items-center gap-2">
          <Pin className="h-4 w-4" />
          Pinned announcements
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="urgent"
          checked={filters.isUrgent === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ isUrgent: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="urgent" className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Urgent announcements
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="requires-acknowledgment"
          checked={filters.requiresAcknowledgment === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ requiresAcknowledgment: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="requires-acknowledgment" className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Requires acknowledgment
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-expiration"
          checked={filters.hasExpiration === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ hasExpiration: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="has-expiration" className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Has expiration date
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="email-notification"
          checked={filters.sendEmailNotification === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ sendEmailNotification: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="email-notification" className="text-sm flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email notification sent
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="push-notification"
          checked={filters.sendPushNotification === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ sendPushNotification: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="push-notification" className="text-sm flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Push notification sent
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="homepage"
          checked={filters.displayOnHomepage === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ displayOnHomepage: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="homepage" className="text-sm flex items-center gap-2">
          <Home className="h-4 w-4" />
          Display on homepage
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="dashboard"
          checked={filters.displayInDashboard === true}
          onCheckedChange={(checked) =>
            onFiltersChange({ displayInDashboard: checked === true ? true : undefined })
          }
        />
        <Label htmlFor="dashboard" className="text-sm flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Display in dashboard
        </Label>
      </div>
    </div>
  );
}
