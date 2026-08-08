/**
 * Authentication event levels — the event-type taxonomy and the severity
 * ladder for auth_logs entries, plus the console-line formatter shared by
 * the transports.
 */

/**
 * Authentication event types
 */
export enum AuthEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  SIGNUP_SUCCESS = "signup_success",
  SIGNUP_FAILURE = "signup_failure",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_SUCCESS = "password_reset_success",
  PASSWORD_RESET_FAILURE = "password_reset_failure",
  EMAIL_VERIFICATION_SUCCESS = "email_verification_success",
  EMAIL_VERIFICATION_FAILURE = "email_verification_failure",
  ACCOUNT_DEACTIVATION = "account_deactivation",
  ACCOUNT_REACTIVATION = "account_reactivation",
  ACCOUNT_DELETION = "account_deletion",
  PASSWORD_CHANGE = "password_change",
  PROFILE_UPDATE = "profile_update",
  SECURITY_QUESTION_UPDATE = "security_question_update",
  TWO_FACTOR_ENABLE = "two_factor_enable",
  TWO_FACTOR_DISABLE = "two_factor_disable",
  SESSION_EXPIRED = "session_expired",
  SESSION_INVALIDATED = "session_invalidated",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
}

/**
 * Authentication event severity levels
 */
export enum AuthEventSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Format the console line shared by the transports:
 * `[AuthEvent] <event type>: <message>`.
 */
export function formatAuthEventMessage(eventType: AuthEventType, message: string): string {
  return `[AuthEvent] ${eventType}: ${message}`;
}
