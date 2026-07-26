/**
 * Security Utilities
 *
 * Additional security functions for role-based access control,
 * rate limiting, and security monitoring.
 */

import { headers } from "next/headers";
import { auth } from "./auth";
import { hasPermission, hasRole, getCurrentUser } from "./rbac";
import { Role, Permission } from "@/types/role.types";

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
  AUTH_SUCCESS = "auth_success",
  AUTH_FAILURE = "auth_failure",
  ROLE_CHANGE = "role_change",
  PERMISSION_DENIED = "permission_denied",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  BRUTE_FORCE_ATTEMPT = "brute_force_attempt",
  PRIVILEGE_ESCALATION = "privilege_escalation",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
}

/**
 * Log security events for monitoring and audit
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  details: {
    userId?: string;
    userRole?: string;
    resource?: string;
    action?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  },
) {
  try {
    const requestHeaders = await headers();
    const ipAddress =
      details.ipAddress ||
      requestHeaders.get("x-forwarded-for") ||
      requestHeaders.get("x-real-ip") ||
      "unknown";
    const userAgent = details.userAgent || requestHeaders.get("user-agent") || "unknown";

    const logEntry = {
      eventType,
      timestamp: new Date().toISOString(),
      userId: details.userId,
      userRole: details.userRole,
      resource: details.resource,
      action: details.action,
      ipAddress,
      userAgent,
      metadata: details.metadata,
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[SECURITY] ${eventType}:`, logEntry);
    }

    // TODO: Send to external security monitoring service
    // Example: Send to Sentry, Datadog, or custom security endpoint

    return logEntry;
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

/**
 * Server-side authorization check for API routes
 */
export async function authorizeApi(
  requiredRole?: Role,
  requiredPermission?: Permission,
): Promise<{
  authorized: boolean;
  user?: any;
  reason?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      await logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        action: "api_access_denied",
        resource: requiredPermission || `role_${requiredRole}`,
        metadata: { reason: "no_session" },
      });

      return {
        authorized: false,
        reason: "UNAUTHORIZED",
      };
    }

    // Check role requirement
    if (requiredRole) {
      const hasRequiredRole = await hasRole(requiredRole as any);

      if (!hasRequiredRole) {
        await logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId: user.id,
          userRole: user.role,
          action: "role_check_failed",
          resource: `role_${requiredRole}`,
          metadata: { requiredRole, userRole: user.role },
        });

        return {
          authorized: false,
          user,
          reason: "INSUFFICIENT_ROLE",
        };
      }
    }

    // Check permission requirement
    if (requiredPermission) {
      const hasRequiredPermission = await hasPermission(requiredPermission);

      if (!hasRequiredPermission) {
        await logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId: user.id,
          userRole: user.role,
          action: "permission_check_failed",
          resource: requiredPermission,
          metadata: { requiredPermission, userRole: user.role },
        });

        return {
          authorized: false,
          user,
          reason: "INSUFFICIENT_PERMISSION",
        };
      }
    }

    return {
      authorized: true,
      user,
    };
  } catch (error) {
    console.error("Authorization check failed:", error);

    await logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
      action: "authorization_error",
      metadata: { error: error instanceof Error ? error.message : "unknown" },
    });

    return {
      authorized: false,
      reason: "INTERNAL_ERROR",
    };
  }
}

/**
 * Check if user can perform sensitive operations (self-service restrictions)
 */
export function canPerformSensitiveOperation(
  userRole: Role,
  operation: "change_own_role" | "delete_own_account" | "disable_2fa" | "bypass_mfa",
): boolean {
  // Prevent certain operations for users
  const restrictedOperations = {
    change_own_role: ["superadmin"], // Only superadmin can change roles
    delete_own_account: ["superadmin", "admin"], // Only admins can delete accounts
    disable_2fa: [], // No one can disable 2FA once enabled (security best practice)
    bypass_mfa: ["superadmin"], // Only superadmin can bypass MFA
  };

  return (restrictedOperations[operation] as string[])?.includes(userRole as any) || false;
}

/**
 * Rate limiting helper for sensitive operations
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
  ) {}

  async isAllowed(
    identifier: string,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.attempts.get(identifier);

    if (!existing || now > existing.resetTime) {
      // Reset or create new window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: now + this.windowMs,
      };
    }

    // Check if limit exceeded
    if (existing.count >= this.maxAttempts) {
      await logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
        action: "rate_limit_exceeded",
        resource: identifier,
        metadata: {
          attempts: existing.count,
          maxAttempts: this.maxAttempts,
          windowMs: this.windowMs,
        },
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
      };
    }

    // Increment counter
    existing.count++;

    return {
      allowed: true,
      remaining: this.maxAttempts - existing.count,
      resetTime: existing.resetTime,
    };
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Detect suspicious login patterns
 */
export async function detectSuspiciousLogin(
  user: any,
  loginDetails: {
    ipAddress: string;
    userAgent: string;
    location?: string;
  },
): Promise<{
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
}> {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check for new IP address
  const recentIps = await getRecentUserIps(user.id);
  if (!recentIps.includes(loginDetails.ipAddress)) {
    reasons.push("New IP address");
    riskScore += 30;
  }

  // Check for unusual user agent
  const recentUserAgents = await getRecentUserAgents(user.id);
  if (!recentUserAgents.includes(loginDetails.userAgent)) {
    reasons.push("New user agent");
    riskScore += 20;
  }

  // Check for suspicious time patterns
  const currentHour = new Date().getHours();
  if (currentHour < 6 || currentHour > 22) {
    reasons.push("Unusual login time");
    riskScore += 15;
  }

  // Check for multiple failed attempts
  const recentFailures = await getRecentFailedLogins(loginDetails.ipAddress);
  if (recentFailures > 3) {
    reasons.push("Multiple recent failures");
    riskScore += 40;
  }

  const isSuspicious = riskScore >= 50;

  if (isSuspicious) {
    await logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
      userId: user.id,
      userRole: user.role,
      action: "suspicious_login_detected",
      metadata: {
        riskScore,
        reasons,
        loginDetails,
      },
    });
  }

  return {
    isSuspicious,
    riskScore,
    reasons,
  };
}

/**
 * Helper functions (placeholders - would be implemented with database calls)
 */
async function getRecentUserIps(userId: string): Promise<string[]> {
  // TODO: Implement database query to get recent IP addresses
  return [];
}

async function getRecentUserAgents(userId: string): Promise<string[]> {
  // TODO: Implement database query to get recent user agents
  return [];
}

async function getRecentFailedLogins(ipAddress: string): Promise<number> {
  // TODO: Implement database query to count recent failed logins
  return 0;
}

/**
 * Create rate limiters for different operations
 */
export const rateLimiters = {
  login: new RateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  passwordReset: new RateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  roleChange: new RateLimiter(10, 60 * 60 * 1000), // 10 role changes per hour
  sensitiveAction: new RateLimiter(20, 60 * 60 * 1000), // 20 sensitive actions per hour
};
