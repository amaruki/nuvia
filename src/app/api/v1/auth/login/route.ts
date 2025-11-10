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
    
    // Debug: Log the result to see if cookies are included
    console.log('Login result:', JSON.stringify(result, null, 2));
    
    // Check if the result has a response object with cookies
    if (result && typeof result === 'object' && 'response' in result) {
      // If it's a Next.js Response object, we need to handle it differently
      const response = result.response as Response;
      console.log('Response headers from better-auth:', response.headers);
      
      // Create a new response that includes the cookies from the better-auth response
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Merge with our rate limit headers
      const mergedHeaders = { ...responseHeaders, ...headers };
      
      return new NextResponse(JSON.stringify(result), {
        status: response.status,
        headers: mergedHeaders,
      });
    }
    
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