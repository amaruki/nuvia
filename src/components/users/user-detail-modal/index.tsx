"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserDetailModalProps } from "./types";
import UserDetailModalHeader from "./dialog-header";
import OverviewTab from "./overview-tab";
import SecurityTab from "./security-tab";

export function UserDetailModal({ user, open, onOpenChange }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return null;

  // Only tabs backed by real data survive (UI-09 C3): Overview and Security.
  // The old Actions tab rendered dead buttons and Activity was a stub.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <UserDetailModalHeader user={user} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <OverviewTab user={user} />
          <SecurityTab user={user} />
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserDetailModal;
