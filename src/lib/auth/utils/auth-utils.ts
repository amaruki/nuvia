/**
 * AuthUtils facade.
 *
 * Preserves the historical class-based API (`AuthUtils.getSession()`, ...)
 * after the split of src/lib/auth/utils.ts into this folder. The
 * implementations live in the concern modules; each static member is bound
 * to the corresponding function with an identical signature.
 */

import { deleteAccount } from "./account";
import { getUserById, listUsers, updateUserRole } from "./admin";
import { changePassword } from "./password";
import { updateProfile } from "./profile";
import { hasRole, requireRole } from "./roles";
import {
  getCurrentUser,
  getCurrentUserId,
  getSession,
  isAuthenticated,
  requireAuth,
  signOut,
} from "./session";

/**
 * Consolidated authentication utilities class
 */
export class AuthUtils {
  /**
   * Get the current session from the request
   */
  static getSession = getSession;

  /**
   * Get the current user from the session
   */
  static getCurrentUser = getCurrentUser;

  /**
   * Get the current user ID
   */
  static getCurrentUserId = getCurrentUserId;

  /**
   * Check if a user is authenticated
   */
  static isAuthenticated = isAuthenticated;

  /**
   * Require authentication - throws error if not authenticated
   */
  static requireAuth = requireAuth;

  /**
   * Check if user has specific role
   */
  static hasRole = hasRole;

  /**
   * Require specific role - throws error if user doesn't have role
   */
  static requireRole = requireRole;

  /**
   * Update user profile
   */
  static updateProfile = updateProfile;

  /**
   * Change user password
   */
  static changePassword = changePassword;

  /**
   * Sign out current user
   */
  static signOut = signOut;

  /**
   * Delete user account
   */
  static deleteAccount = deleteAccount;

  /**
   * Get user by ID (admin function)
   */
  static getUserById = getUserById;

  /**
   * List users (admin function)
   */
  static listUsers = listUsers;

  /**
   * Update user role (admin function)
   */
  static updateUserRole = updateUserRole;
}
