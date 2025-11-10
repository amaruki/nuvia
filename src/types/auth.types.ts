// Base user type without sensitive information
export type SafeUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  displayName?: string | null;
  profilePhoto?: string | null; // Better Auth can return null for optional image fields
  bio?: string | null;
  externalLinks?: any; // JSON field from Better Auth
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

// Prisma User type
export type User = SafeUser & {
  passwordHash?: string;
  emailVerificationToken?: string;
};

// Prisma UserLoginActivity type
export type UserLoginActivity = {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent?: string;
  deviceType?: string;
  location?: string;
  loginAt: Date;
  successful: boolean;
};

// Prisma ActiveDevice type
export type ActiveDevice = {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive: Date;
  createdAt: Date;
  isActive: boolean;
};

// Prisma PasswordResetToken type
export type PasswordResetToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
};

// User with login activity and devices
export type UserWithDetails = SafeUser & {
  loginActivities?: UserLoginActivity[];
  activeDevices?: ActiveDevice[];
};

// External link type for user profile
export type ExternalLink = {
  platform: string;
  url: string;
  username?: string;
};

// Login request type
export type LoginRequest = {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
};

// Signup request type
export type SignupRequest = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

// Forgot password request type
export type ForgotPasswordRequest = {
  email: string;
};

// Reset password request type
export type ResetPasswordRequest = {
  token: string;
  password: string;
  confirmPassword: string;
};

// Update profile request type
export type UpdateProfileRequest = {
  displayName?: string;
  bio?: string;
  username?: string;
  externalLinks?: ExternalLink[];
  image?: string;
};

// Change password request type
export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Device info type
export type DeviceInfo = {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  userAgent: string;
};

// Login activity info type
export type LoginActivityInfo = {
  ipAddress: string;
  userAgent?: string;
  deviceType?: string;
  location?: string;
  successful: boolean;
};

// Rate limit info type
export type RateLimitInfo = {
  attempts: number;
  remaining: number;
  resetTime: Date;
  isLimited: boolean;
};

// Auth response type
export type AuthResponse = {
  success: boolean;
  message: string;
  data?: {
    user: SafeUser;
    session?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
    };
  };
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: Date;
    version: string;
  };
};

// Password reset response type
export type PasswordResetResponse = {
  success: boolean;
  message: string;
  data?: {
    email: string;
    resetTokenExpiry: Date;
  };
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: Date;
    version: string;
  };
};

// OAuth provider type
export type OAuthProvider = 'google' | 'github' | 'linkedin';

// OAuth profile type
export type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name?: string;
  image?: string;
  username?: string;
};

// Session type
export type UserSession = {
  user: SafeUser;
  expires: Date;
  accessToken?: string;
};

// Device session type
export type DeviceSession = {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
};

// Login history type
export type LoginHistory = {
  id: string;
  ipAddress: string;
  deviceType?: string;
  location?: string;
  loginAt: Date;
  successful: boolean;
};