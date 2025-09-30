import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/utils/better-auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { username, email, password, displayName } = body;
    
    // Process signup
    const result = await signUp(username, email, password, displayName);
    
    return NextResponse.json(result);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during signup',
        errors: {
          server: ['Please try again later'],
        },
        meta: {
          timestamp: new Date(),
          version: 'v1',
        },
      },
      { status: 500 }
    );
  }
}