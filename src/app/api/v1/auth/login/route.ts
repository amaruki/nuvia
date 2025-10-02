import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/utils/better-auth-utils';
import { rateLimiters, createRateLimitResponse } from '@/lib/utils/rate-limiter';
import { loginSchema } from '@/lib/validation/auth.validation';
import { fromZodError } from 'zod-validation-error';

export async function POST(request: NextRequest) {
  const headers: Record<string, string> = {};

  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.login(request);
    
    // Add rate limit headers to response
    
    headers['X-RateLimit-Limit'] = rateLimitResult.attempts.toString();
    headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
    headers['X-RateLimit-Reset'] = rateLimitResult.resetTime.toISOString();
    
    
    // Check if rate limit exceeded
    if (rateLimitResult.isLimited) {
      headers['Retry-After'] = Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString();
      return createRateLimitResponse(rateLimitResult);
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: {
            validation: validationError.message,
          },
          meta: {
            timestamp: new Date(),
            version: 'v1',
          },
        },
        {
          status: 400,
          headers: headers,
        }
      );
    }
    
    const { emailOrUsername, password } = validationResult.data;
    
    // Process login
    const result = await signIn(emailOrUsername, password);
    
    return NextResponse.json(result, { headers: headers });
  } catch (error) {
    console.error('Login error:', error);
    
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during login',
        errors: {
          server: ['Please try again later'],
        },
        meta: {
          timestamp: new Date(),
          version: 'v1',
        },
      },
      {
        status: 500,
        headers: headers,
      }
    );
  }
}