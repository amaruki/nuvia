import { Crown, Diamond, Gem, Shield, Star, Zap } from "lucide-react";
import { MembershipTier } from "@/types/membership.types";

export const tierIcons = {
  [MembershipTier.BASIC]: Shield,
  [MembershipTier.STUDENT]: Star,
  [MembershipTier.PROFESSIONAL]: Zap,
  [MembershipTier.CORPORATE]: Crown,
  [MembershipTier.VIP]: Diamond,
  [MembershipTier.PREMIUM]: Gem,
};
