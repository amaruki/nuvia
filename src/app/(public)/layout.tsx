/**
 * Layout for the events section
 */

import { ReactNode } from "react";

interface SiteProps {
  children: ReactNode;
}

export default function Site({ children }: SiteProps) {
  return <>{children}</>;
}
