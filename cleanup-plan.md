# Codebase Cleanup Plan

## Overview
This document outlines the cleanup plan for the Nuvia codebase, focusing on removing redundant code, reducing debug logging verbosity, and optimizing the OAuth service structure.

## Cleanup Tasks

### 1. Remove Redundant OAuth Callback Handler ✅
- **File**: `src/app/api/auth/callback/google/route.ts`
- **Action**: Delete this file
- **Reason**: We have a dynamic OAuth callback handler at `src/app/api/auth/callback/[provider]/route.ts` that handles all providers

### 2. Clean Up Debug Logging (Reduce Verbosity)
- **Files**: 
  - `src/lib/auth.ts`
  - `src/app/auth/callback/page.tsx`
  - `src/lib/actions/oauth-better-auth.actions.ts`
  - `src/lib/services/oauth.service.ts`
  - `src/app/api/auth/callback/[provider]/route.ts`
- **Actions**:
  - Remove excessive console.log statements
  - Keep only essential error logging
  - Simplify debug hooks in auth.ts
  - Reduce timestamp logging
  - Remove redundant environment variable logging

### 3. Remove Unused Debug Endpoints
- **Files**:
  - `src/app/api/debug/route.ts`
  - `src/app/api/debug/oauth/route.ts`
- **Actions**:
  - Remove or simplify debug endpoints
  - Keep only essential debugging capabilities

### 4. Organize File Structure
- **Actions**:
  - Ensure consistent file naming conventions
  - Group related files together
  - Remove any empty directories

### 5. Remove Duplicate or Unused Code
- **Files**: Multiple files across the codebase
- **Actions**:
  - Identify and remove duplicate functions
  - Remove unused imports
  - Clean up redundant validation logic

### 6. Clean Up Imports
- **Files**: All TypeScript files
- **Actions**:
  - Remove unused imports
  - Organize imports consistently
  - Use proper import aliases

### 7. Optimize OAuth Service Structure
- **File**: `src/lib/services/oauth.service.ts`
- **Actions**:
  - Simplify the OAuth service class
  - Remove redundant methods
  - Streamline the OAuth flow

### 8. Final Code Cleanup Review
- **Actions**:
  - Review all changes
  - Ensure no functionality is broken
  - Run tests to verify everything works

## Implementation Order
1. Remove redundant OAuth callback handler
2. Clean up debug logging in all files
3. Remove unused debug endpoints
4. Remove duplicate or unused code
5. Clean up imports
6. Optimize OAuth service structure
7. Organize file structure
8. Final code cleanup review

## Files to be Modified

### Files to Delete
- `src/app/api/auth/callback/google/route.ts` (redundant)

### Files to Modify
- `src/lib/auth.ts` - reduce debug logging
- `src/app/auth/callback/page.tsx` - reduce debug logging
- `src/lib/actions/oauth-better-auth.actions.ts` - reduce debug logging
- `src/lib/services/oauth.service.ts` - reduce debug logging and optimize structure
- `src/app/api/auth/callback/[provider]/route.ts` - reduce debug logging
- `src/app/api/debug/route.ts` - simplify or remove
- `src/app/api/debug/oauth/route.ts` - simplify or remove

## Expected Outcomes
- Cleaner, more maintainable codebase
- Reduced log verbosity in production
- Removal of redundant code
- Improved performance due to fewer unnecessary operations
- Better organized file structure