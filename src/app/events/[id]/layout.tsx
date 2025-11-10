/**
 * Layout for event details pages
 */

import { ReactNode } from 'react';

interface EventDetailsLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function EventDetailsLayout({ children, params }: EventDetailsLayoutProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}