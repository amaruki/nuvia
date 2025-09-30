import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/utils/better-auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;
    
    // Process login
    const result = await signIn(email, password);
    
    return NextResponse.json(result);
  } catch (error) {
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
      { status: 500 }
    );
  }
}