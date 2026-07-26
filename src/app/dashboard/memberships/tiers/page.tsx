"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetContainer } from "@/components/ui/widget-container";
import { useHeader } from "@/contexts/dashboard-context";
import { MembershipTier } from "@/types/membership.types";
import { TierDetailModal } from "@/components/memberships/tier-detail-modal";
import { TierEditModal } from "@/components/memberships/tier-edit-modal";
import { MembershipConfigModal } from "@/components/memberships/membership-config-modal";
import {
  Users,
  TrendingUp,
  Settings,
  Plus,
  Star,
  User,
  GraduationCap,
  Award,
  Briefcase,
  Crown,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { logger } from "@/lib/logger";

interface TierData {
  tier: MembershipTier;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  benefits: string[];
  memberCount: number;
  status: "active" | "inactive" | "popular";
  icon: ReactNode;
  color: string;
  visibility?: boolean;
  upgradeFrom?: string[];
  upgradeTo?: string[];
  restrictions?: string[];
}

interface MembershipConfig {
  defaultTier?: string;
  trialPeriodDays: number;
  autoRenewal: boolean;
  cancellationPolicy: string;
  paymentGateway: string;
  currency: string;
  welcomeEmail: boolean;
  upgradeReminders: boolean;
  renewalReminders: boolean;
  defaultPermissions: string[];
}

export default function MembershipTiers() {
  const { setHeader, clearHeader } = useHeader();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Mock data - replace with actual API call
  const tiersData: TierData[] = [
    {
      tier: MembershipTier.BASIC,
      name: "Basic Member",
      description: "Perfect for individuals starting their professional journey",
      price: "$29",
      period: "month",
      features: [
        "Community access",
        "Basic networking",
        "Monthly newsletter",
        "Event attendance",
        "Profile directory listing",
      ],
      benefits: ["Connect with 500+ members", "Attend 2 events per month", "Access to resources"],
      memberCount: 1247,
      status: "active",
      icon: <User className="w-5 h-5" />,
      color: "blue",
      visibility: true,
      upgradeFrom: [],
      upgradeTo: ["Student Member", "Professional Member"],
      restrictions: [],
    },
    {
      tier: MembershipTier.STUDENT,
      name: "Student Member",
      description: "Special pricing for students and recent graduates",
      price: "$15",
      period: "month",
      features: [
        "All Basic features",
        "Student-only events",
        "Mentorship program",
        "Career resources",
        "Academic discounts",
      ],
      benefits: ["50% discount on events", "Free mentorship matching", "Career coaching sessions"],
      memberCount: 523,
      status: "active",
      icon: <GraduationCap className="w-5 h-5" />,
      color: "green",
      visibility: true,
      upgradeFrom: ["Basic Member"],
      upgradeTo: ["Professional Member", "VIP Member"],
      restrictions: ["Valid student ID required"],
    },
    {
      tier: MembershipTier.PROFESSIONAL,
      name: "Professional Member",
      description: "Ideal for established professionals and experts",
      price: "$79",
      period: "month",
      features: [
        "All Basic features",
        "Premium networking",
        "Advanced analytics",
        "Lead generation tools",
        "Priority support",
        "Webinar hosting",
      ],
      benefits: [
        "Unlimited event access",
        "Featured profile placement",
        "Advanced member directory",
        "Business development resources",
      ],
      memberCount: 892,
      status: "popular",
      icon: <Award className="w-5 h-5" />,
      color: "purple",
      visibility: true,
      upgradeFrom: ["Basic Member", "Student Member"],
      upgradeTo: ["VIP Member", "Premium Member"],
      restrictions: [],
    },
    {
      tier: MembershipTier.CORPORATE,
      name: "Corporate Member",
      description: "Comprehensive solution for teams and organizations",
      price: "$299",
      period: "month",
      features: [
        "All Professional features",
        "Team management",
        "Corporate branding",
        "Bulk event tickets",
        "Dedicated support",
        "Custom integrations",
      ],
      benefits: [
        "Up to 10 team members",
        "Company branding opportunities",
        "Exclusive corporate events",
        "Volume discounts",
      ],
      memberCount: 156,
      status: "active",
      icon: <Briefcase className="w-5 h-5" />,
      color: "orange",
      visibility: true,
      upgradeFrom: ["Professional Member"],
      upgradeTo: ["Premium Member"],
      restrictions: ["Minimum 5 team members"],
    },
    {
      tier: MembershipTier.VIP,
      name: "VIP Member",
      description: "Premium experience for industry leaders and influencers",
      price: "$199",
      period: "month",
      features: [
        "All Professional features",
        "VIP event access",
        "Executive networking",
        "Personal concierge",
        "Exclusive content",
        "One-on-one coaching",
      ],
      benefits: [
        "Invitation-only events",
        "Personal brand consulting",
        "Priority speaking opportunities",
        "Elite networking circles",
      ],
      memberCount: 89,
      status: "active",
      icon: <Star className="w-5 h-5" />,
      color: "yellow",
      visibility: true,
      upgradeFrom: ["Professional Member", "Student Member"],
      upgradeTo: ["Premium Member"],
      restrictions: ["Invitation only", "Industry leader status required"],
    },
    {
      tier: MembershipTier.PREMIUM,
      name: "Premium Member",
      description: "Ultimate membership experience with maximum benefits",
      price: "$399",
      period: "month",
      features: [
        "All VIP features",
        "Lifetime directory listing",
        "Content creation tools",
        "Advanced analytics",
        "API access",
        "White-label opportunities",
      ],
      benefits: [
        "Lifetime membership option",
        "Revenue sharing program",
        "Board nomination eligibility",
        "Premium advertising placement",
      ],
      memberCount: 47,
      status: "active",
      icon: <Crown className="w-5 h-5" />,
      color: "red",
      visibility: true,
      upgradeFrom: ["VIP Member", "Corporate Member"],
      upgradeTo: [],
      restrictions: ["Board approval required"],
    },
  ];

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

  const handleSaveTier = (updatedTier: any) => {
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

  const handleConfigure = () => {
    setConfigModalOpen(true);
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
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WidgetContainer
          title="Total Members"
          description="Across all membership tiers"
          size="small"
          type="member-statistics"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">+12% from last month</p>
            </div>
          </div>
        </WidgetContainer>

        <WidgetContainer
          title="Active Tiers"
          description="Currently available membership options"
          size="small"
          type={"user-profile"}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeTiers}</p>
              <p className="text-sm text-muted-foreground">All tiers active</p>
            </div>
          </div>
        </WidgetContainer>

        <WidgetContainer
          title="Most Popular"
          description="Highest member count"
          size="small"
          type={"user-profile"}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">Professional</p>
              <p className="text-sm text-muted-foreground">892 members</p>
            </div>
          </div>
        </WidgetContainer>
      </div>

      {/* Management Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Membership Tiers</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleConfigure}>
            Configure
          </Button>
          <Button size="sm" onClick={handleAddTier}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tier
          </Button>
        </div>
      </div>

      {/* Membership Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiersData.map((tier) => (
          <Card key={tier.tier} className="border bg-card transition-shadow hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg mb-1">{tier.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-semibold">{tier.price}</span>
                      <span className="text-sm text-muted-foreground ml-1">/{tier.period}</span>
                    </div>
                    {tier.status === "popular" && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant={tier.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {tier.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{tier.memberCount.toLocaleString()}</span>
              </div>

              <div className="text-sm text-muted-foreground line-clamp-2">{tier.description}</div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => handleEditTier(tier)}
                >
                  Manage
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleViewDetails(tier)}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
