/**
 * Event detail pages render inside the dashboard shell, which already owns
 * the page container and background — this layout intentionally adds no
 * wrapper of its own (the previous `min-h-screen bg-background` div was
 * redundant inside the shell).
 */

import { ReactNode } from "react";

interface EventDetailsLayoutProps {
  children: ReactNode;
}

export default function EventDetailsLayout({ children }: EventDetailsLayoutProps) {
  return children;
}
