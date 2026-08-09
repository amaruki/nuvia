"use client";

import { Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ActionBarProps {
  onAddTier: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ActionBar({ onAddTier, onRefresh, isRefreshing }: ActionBarProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold">Membership Tiers</h2>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button size="sm" onClick={onAddTier}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tier
        </Button>
      </div>
    </div>
  );
}
