"use client";

import type { CategoriesOverviewCardsProps } from "./types";
import {
  ActiveCategoriesCard,
  ArchivedCategoriesCard,
  InactiveCategoriesCard,
  TotalCategoriesCard,
} from "./stat-cards";

export function CategoriesOverviewCards({ statistics }: CategoriesOverviewCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Categories */}
      <TotalCategoriesCard statistics={statistics} />

      {/* Active Categories */}
      <ActiveCategoriesCard statistics={statistics} />

      {/* Inactive Categories */}
      <InactiveCategoriesCard statistics={statistics} />

      {/* Archived Categories */}
      <ArchivedCategoriesCard statistics={statistics} />
    </div>
  );
}
