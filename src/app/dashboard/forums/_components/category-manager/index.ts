/**
 * Category manager barrel.
 *
 * Keeps "@/app/dashboard/forums/_components/category-manager" resolving after
 * the old monolithic category-manager.tsx was split into this directory:
 *
 *   - category-manager.tsx       CategoryManager state, handlers and composition
 *   - category-card.tsx          category card with icon, stats and actions menu
 *   - category-skeleton.tsx      loading placeholder grid
 *   - category-empty-state.tsx   empty state with the create-dialog trigger
 *   - create-category-dialog.tsx create dialog for the header action and empty state
 *   - edit-category-dialog.tsx   edit dialog opened from a card's actions menu
 *   - types.ts                   shared CategoryFormData
 */
export { CategoryManager } from "./category-manager";
