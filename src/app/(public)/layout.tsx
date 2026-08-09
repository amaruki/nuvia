/**
 * Layout for the events section
 */

import { ReactNode } from "react";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface SiteProps {
  children: ReactNode;
}

export default function Site({ children }: SiteProps) {
  return <>{children}</>;
}
