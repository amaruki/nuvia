"use client";

import * as React from "react";

interface OrganizationBrandingData {
  name: string;
  logo: string | null;
  website: string | null;
  supportEmail: string | null;
}

/**
 * Module-level promise cache: at most one in-flight GET per page load, and
 * later mounts (footer appears on every dashboard page) reuse the result.
 * The read needs organization:read, which every authenticated role holds.
 */
let organizationFetch: Promise<OrganizationBrandingData | null> | null = null;

async function fetchOrganization(): Promise<OrganizationBrandingData | null> {
  try {
    const response = await fetch("/api/v1/organization", { credentials: "include" });
    if (!response.ok) return null;

    const body = await response.json();
    const data = body?.data;

    if (!data || typeof data.name !== "string" || data.name.trim() === "") return null;

    return {
      name: data.name,
      logo: typeof data.logo === "string" ? data.logo : null,
      website: typeof data.website === "string" ? data.website : null,
      supportEmail: typeof data.supportEmail === "string" ? data.supportEmail : null,
    };
  } catch {
    return null;
  }
}

function useOrganization(): OrganizationBrandingData | null {
  const [organization, setOrganization] = React.useState<OrganizationBrandingData | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    organizationFetch ??= fetchOrganization();
    organizationFetch.then((result) => {
      if (!cancelled) setOrganization(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return organization;
}

/**
 * Dashboard copyright line, driven by the organization singleton instead of
 * a hardcoded product name. Falls back to the product name if the fetch
 * fails or the user lacks permission — branding must never break the page.
 */
export function OrganizationCopyright() {
  const organization = useOrganization();
  const name = organization?.name ?? "Nuvia Community Platform";

  return (
    <p className="text-sm text-foreground/75">
      © {new Date().getFullYear()} {name}. All rights reserved.
    </p>
  );
}

/**
 * Footer contact link: points at the organization's support email when one
 * is configured, otherwise falls back to the contact page.
 */
export function ContactLink() {
  const organization = useOrganization();
  const href = organization?.supportEmail ? `mailto:${organization.supportEmail}` : "/contact";

  return (
    <a href={href} className="text-sm text-foreground/75 hover:text-foreground/90">
      Contact Us
    </a>
  );
}
