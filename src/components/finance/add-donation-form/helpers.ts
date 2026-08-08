import { Building, Gift, HandHeart, Repeat, User, UserX } from "lucide-react";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getDonorTypeIcon = (donorType: string) => {
  switch (donorType) {
    case "individual":
      return User;
    case "organization":
      return Building;
    case "anonymous":
      return UserX;
    default:
      return User;
  }
};

export const getDonationTypeIcon = (donationType: string) => {
  switch (donationType) {
    case "one_time":
      return Gift;
    case "recurring":
      return Repeat;
    case "pledge":
      return HandHeart;
    default:
      return Gift;
  }
};
