/**
 * Application configuration
 */


// Rate limiting configuration
export const RATE_LIMITING = {
  // Max requests per window
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10),
  // Window in minutes
  WINDOW_MINUTES: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10),
};

// Database configuration
export const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

// Email configuration
export const EMAIL_CONFIG = {
  HOST: process.env.EMAIL_HOST || '',
  PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  USER: process.env.EMAIL_USER || '',
  PASS: process.env.EMAIL_PASS || '',
  FROM: process.env.EMAIL_FROM || 'noreply@example.com',
};

// Application URL (for generating links in emails)
export const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Environment
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Debug mode
export const DEBUG = NODE_ENV === 'development';

// Security settings
export const SECURITY = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  // Bcrypt salt rounds
  BCRYPT_SALT_ROUNDS: 12,
  // Session timeout in minutes
  SESSION_TIMEOUT: 60 * 24 * 7, // 7 days
  // Max login attempts before lockout
  MAX_LOGIN_ATTEMPTS: 5,
  // Lockout duration in minutes
  LOCKOUT_DURATION: 15,
};

// CORS configuration
export const CORS = {
  ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
};

// API configuration
export const API = {
  VERSION: 'v1',
  PREFIX: '/api/v1',
};

// Upload configuration
export const UPLOAD = {
  MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10), // 5MB in bytes
  ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
};

// Logging configuration
export const LOGGING = {
  LEVEL: process.env.LOGGING_LEVEL || 'info',
  // Enable request logging
  REQUESTS: process.env.LOGGING_REQUESTS === 'true',
  // Enable error logging
  ERRORS: process.env.LOGGING_ERRORS !== 'false',
};

// Feature flags
export const FEATURES = {
  // Enable email verification
  EMAIL_VERIFICATION: process.env.FEATURE_EMAIL_VERIFICATION !== 'false',
  // Enable two-factor authentication
  TWO_FACTOR_AUTH: process.env.FEATURE_TWO_FACTOR_AUTH === 'true',
  // Enable social login
  SOCIAL_LOGIN: process.env.FEATURE_SOCIAL_LOGIN === 'true',
  // Enable account deletion
  ACCOUNT_DELETION: process.env.FEATURE_ACCOUNT_DELETION !== 'false',
  // Enable password strength meter
  PASSWORD_STRENGTH_METER: process.env.FEATURE_PASSWORD_STRENGTH_METER !== 'false',
};

// Social login providers
export const SOCIAL_PROVIDERS = {
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    ISENABLED: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? true : false,
  },
  GITHUB: {
    CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    ISENABLED: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? true : false,
  },
  FACEBOOK: {
    CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || '',
    CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || '',
    ISENABLED: process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? true : false,
  },
  LINKEDIN: {
    CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
    CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || '',
    ISENABLED: process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? true : false,
  },
};

// Validate required environment variables
export function validateEnvironment(): void {
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
  
  if (NODE_ENV === 'production') {
    requiredVars.push('EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM');
  }
  
  const missingVars: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Warn if using default JWT secret in production
  if (NODE_ENV === 'production' && JWT_SECRET === 'your-secret-key-change-in-production') {
    console.warn('WARNING: Using default JWT secret in production. Please set a secure JWT_SECRET environment variable.');
  }
}