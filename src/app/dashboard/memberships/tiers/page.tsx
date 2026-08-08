"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHeader } from "@/contexts/dashboard-context";
import { MembershipTier } from "@/types/membership.types";
import { TierDetailModal } from "@/components/memberships/tier-detail-modal";
import { TierEditModal } from "@/components/memberships/tier-edit-modal";
import { MembershipConfigModal } from "@/components/memberships/membership-config-modal";
import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

import { ActionBar } from "./_components/action-bar";
import { LoadingState } from "./_components/page-states";
import { StatsOverview } from "./_components/stats-overview";
import { TierCard } from "./_components/tier-card";
import { tiersData } from "./_components/tiers-data";
import type { MembershipConfig, TierData } from "./_components/tiers-types";

export default function MembershipTiers() {
  const { setHeader, clearHeader } = useHeader();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const totalMembers = tiersData.reduce((sum, tier) => sum + tier.memberCount, 0);
  const activeTiers = tiersData.filter((tier) => tier.status !== "inactive").length;

  // Modal event handlers
  const handleViewDetails = (tier: TierData) => {
    setSelectedTier(tier);
    setDetailModalOpen(true);
  };

  const handleEditTier = (tier: TierData) => {
    setSelectedTier(tier);
    setEditModalOpen(true);
  };

  const handleSaveTier = (updatedTier: TierData) => {
    // TODO: Implement API call to save tier
    logger.info("Saving tier", updatedTier);
    // You would typically call an API here
  };

  const handleAddTier = () => {
    const newTier: TierData = {
      tier: MembershipTier.BASIC,
      name: "New Membership Tier",
      description: "Configure this membership tier",
      price: "$0",
      period: "month",
      features: [],
      benefits: [],
      memberCount: 0,
      status: "inactive",
      icon: <Plus className="w-5 h-5" />,
      color: "gray",
      visibility: true,
      upgradeFrom: [],
      upgradeTo: [],
      restrictions: [],
    };
    setSelectedTier(newTier);
    setEditModalOpen(true);
  };

  const handleSaveConfig = (config: MembershipConfig) => {
    // TODO: Implement API call to save configuration
    logger.info("Saving configuration", config);
    // You would typically call an API here
    setConfigModalOpen(false);
  };

  useEffect(() => {
    setHeader({
      title: "Membership Tiers",
      description:
        "Manage and configure membership tiers, pricing, and benefits for your community",
    });

    setIsLoading(false);

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Statistics Overview */}
      <StatsOverview totalMembers={totalMembers} activeTiers={activeTiers} />

      {/* Management Actions */}
      <ActionBar onConfigure={() => setConfigModalOpen(true)} onAddTier={handleAddTier} />

      {/* Membership Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiersData.map((tier) => (
          <TierCard
            key={tier.tier}
            tier={tier}
            onManage={handleEditTier}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Empty State for Additional Content */}
      {tiersData.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-lg flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Membership Tiers</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first membership tier
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Tier
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <TierDetailModal
        tier={selectedTier}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      <TierEditModal
        tier={selectedTier}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleSaveTier}
      />

      <MembershipConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
