import { Crown, Shield, UserCheck, Users } from "lucide-react";

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "administrative":
      return <Shield className="h-4 w-4" />;
    case "leadership":
      return <Crown className="h-4 w-4" />;
    case "staff":
      return <Users className="h-4 w-4" />;
    case "membership":
      return <UserCheck className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};
