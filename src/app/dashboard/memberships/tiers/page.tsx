"use client";

import { AlertTriangle, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoadingState } from "@/components/dashboard/page-states";
import { useHeader } from "@/contexts/dashboard-context";
import { logger } from "@/lib/logger";

import { ActionBar } from "./_components/action-bar";
import { StatsOverview } from "./_components/stats-overview";
import { TierCard } from "./_components/tier-card";
import { TierEditDialog } from "./_components/tier-edit-dialog";
import { fetchTiersWithCounts, type TierDto } from "./_components/tiers-api";

export default function MembershipTiers() {
  const { setHeader, clearHeader } = useHeader();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<TierDto[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [totalActiveMembers, setTotalActiveMembers] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierDto | null>(null);

  const loadTiers = async (mode: "initial" | "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);
    setLoadError(null);
    try {
      const result = await fetchTiersWithCounts();
      setTiers(result.tiers);
      setMemberCounts(result.memberCounts);
      setTotalActiveMembers(result.totalActiveMembers);
    } catch (error) {
      logger.error("Error loading membership tiers", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load membership tiers");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setHeader({
      title: "Membership Tiers",
      description:
        "Manage and configure membership tiers, pricing, and benefits for your community",
    });
    void loadTiers("initial");

    return () => {
      clearHeader();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeader, clearHeader]);

  const handleAddTier = () => {
    setSelectedTier(null);
    setDialogOpen(true);
  };

  const handleManageTier = (tier: TierDto) => {
    setSelectedTier(tier);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    void loadTiers("refresh");
  };

  const handleDeleted = () => {
    toast.success("Tier list refreshed");
    void loadTiers("refresh");
  };

  if (isLoading) {
    return <PageLoadingState cards={3} className="lg:grid-cols-3" />;
  }

  const activeTiers = tiers.filter((tier) => tier.isActive).length;

  return (
    <div className="space-y-6">
      {/* Statistics Overview — real counts from the finance API */}
      <StatsOverview totalActiveMembers={totalActiveMembers} activeTiers={activeTiers} />

      {/* Management Actions */}
      <ActionBar
        onAddTier={handleAddTier}
        onRefresh={() => void loadTiers("refresh")}
        isRefreshing={isRefreshing}
      />

      {loadError && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Could not load membership tiers</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadTiers("refresh")}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Membership Tiers Grid */}
      {tiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              memberCount={memberCounts[tier.id] ?? 0}
              onManage={handleManageTier}
            />
          ))}
        </div>
      ) : (
        !loadError && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-24 h-24 bg-muted rounded-lg flex items-center justify-center mb-6">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Membership Tiers</h3>
              <p className="text-muted-foreground mb-6">
                No tiers exist yet. Create the first membership tier to start offering memberships.
              </p>
              <Button onClick={handleAddTier}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Tier
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Create/Edit dialog — persists through the finance tiers API */}
      <TierEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tier={selectedTier}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
