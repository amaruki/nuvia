"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHeader } from "@/contexts/dashboard-context";
import { logger } from "@/lib/logger";
import { Committee } from "@/types/committee";
import { apiFetch } from "@/lib/api-client";
import { toCommitteeUi, type WireCommittee } from "@/lib/hooks/use-committees";
import { CommitteeCharterTab } from "./_components/committee-charter-tab";
import { CommitteeHeaderActions } from "./_components/committee-header-actions";
import { CommitteeLeadershipTab } from "./_components/committee-leadership-tab";
import { CommitteeMeetingsTab } from "./_components/committee-meetings-tab";
import { CommitteeMembersTab } from "./_components/committee-members-tab";
import { CommitteeOverviewTab } from "./_components/committee-overview-tab";
import { CommitteeQuickStats } from "./_components/committee-quick-stats";
import { CommitteeLoading, CommitteeNotFound } from "./_components/committee-states";

export default function CommitteeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { setHeader, clearHeader } = useHeader();

  const committeeId = params.id as string;

  useEffect(() => {
    // Set header title when committee is loaded
    if (committee) {
      setHeader({
        title: committee.displayName,
        description: committee.description || "Committee details and management",
      });
    }

    return () => {
      clearHeader();
    };
  }, [committee, setHeader, clearHeader]);

  useEffect(() => {
    const fetchCommittee = async () => {
      setLoading(true);
      try {
        const { data } = await apiFetch<WireCommittee>(`/api/v1/committees/${committeeId}`);
        setCommittee(toCommitteeUi(data));
      } catch (error) {
        logger.error("Error fetching committee", error);
        setCommittee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCommittee();
  }, [committeeId]);

  if (loading) {
    return <CommitteeLoading />;
  }

  if (!committee) {
    return <CommitteeNotFound onBack={() => router.back()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <CommitteeHeaderActions onBack={() => router.back()} />

      {/* Quick Stats */}
      <CommitteeQuickStats committee={committee} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="charter">Charter</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <CommitteeOverviewTab committee={committee} />
        <CommitteeLeadershipTab committee={committee} />
        <CommitteeMembersTab committee={committee} />
        <CommitteeCharterTab committee={committee} />
        <CommitteeMeetingsTab committee={committee} />
      </Tabs>
    </div>
  );
}
