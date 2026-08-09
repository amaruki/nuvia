/**
 * Layout for event details pages
 */

import { ReactNode } from "react";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface EventDetailsLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function EventDetailsLayout({ children, params }: EventDetailsLayoutProps) {
  const { id } = await params;

  return <div className="min-h-screen bg-background">{children}</div>;
}
