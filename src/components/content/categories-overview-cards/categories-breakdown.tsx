"use client";

import type { CategoriesBreakdownProps } from "./types";
import { CategoriesByScopeCard } from "./categories-by-scope-card";
import { CategoriesByTypeCard } from "./categories-by-type-card";

export function CategoriesBreakdown({ statistics }: CategoriesBreakdownProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* By Type */}
      <CategoriesByTypeCard statistics={statistics} />

      {/* By Scope */}
      <CategoriesByScopeCard statistics={statistics} />
    </div>
  );
}
