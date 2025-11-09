/**
 * Layout for event details pages
 */

import { ReactNode } from 'react';

interface EventDetailsLayoutProps {
  children: ReactNode;
  params: { id: string };
}

export default function EventDetailsLayout({ children }: EventDetailsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}