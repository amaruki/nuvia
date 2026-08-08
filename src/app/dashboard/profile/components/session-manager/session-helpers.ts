import { Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";

import type { SessionData } from "./types";

export type DeviceType = "unknown" | "mobile" | "tablet" | "desktop";

export type DeviceInfo = {
  type: DeviceType;
  name: string;
  icon: LucideIcon;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

// Matches new Date(undefined) for missing fields: an Invalid Date.
function toDate(value: unknown): Date {
  if (value instanceof Date || typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date(NaN);
}

// Extracts a display message from an unknown thrown value, mirroring the
// `err.message || fallback` pattern without an `any` cast.
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Normalizes the Better Auth session payload into the SessionData shape used
 * by the session-manager components. The payload structure varies between
 * better-auth response shapes (a wrapped `{ session, user }` pair versus an
 * inline record), hence the defensive field lookups.
 */
export function transformSessions(data: unknown): SessionData[] {
  const sessionsArray = Array.isArray(data) ? data : [];
  return sessionsArray.map((entry) => {
    // Handle different session structures
    const payload = isRecord(entry) ? entry : {};
    const sessionData = isRecord(payload.session) ? payload.session : payload;
    const userData = payload.user;

    // Get the session ID - it could be in different places
    const sessionId =
      asString(sessionData.id) || asString(sessionData.token) || asString(payload.id) || "";

    return {
      id: sessionId,
      userId:
        (isRecord(userData) ? asString(userData.id) : undefined) ||
        asString(sessionData.userId) ||
        asString(payload.userId) ||
        "",
      expiresAt: toDate(sessionData.expiresAt),
      ipAddress: asString(sessionData.ipAddress),
      userAgent: asString(sessionData.userAgent),
      createdAt: toDate(sessionData.createdAt),
      lastAccessedAt: toDate(sessionData.lastAccessedAt || sessionData.createdAt),
      token: asString(sessionData.token) || sessionId,
      isCurrent: Boolean(sessionData.isCurrent),
    };
  });
}

export function getDeviceInfo(userAgent?: string): DeviceInfo {
  if (!userAgent) return { type: "unknown", name: "Unknown Device", icon: Monitor };

  const ua = userAgent.toLowerCase();

  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return {
      type: "mobile",
      name: "Mobile Device",
      icon: Smartphone,
    };
  }

  if (ua.includes("tablet") || ua.includes("ipad")) {
    return {
      type: "tablet",
      name: "Tablet",
      icon: Tablet,
    };
  }

  return {
    type: "desktop",
    name: "Desktop",
    icon: Monitor,
  };
}

export function getBrowserInfo(userAgent?: string): string {
  if (!userAgent) return "Unknown Browser";

  const ua = userAgent.toLowerCase();

  if (ua.includes("chrome")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari")) return "Safari";
  if (ua.includes("edge")) return "Edge";
  if (ua.includes("opera")) return "Opera";

  return "Unknown Browser";
}

export function getLocationInfo(ipAddress?: string): string {
  if (!ipAddress) return "Unknown Location";
  return `IP: ${ipAddress}`;
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}
