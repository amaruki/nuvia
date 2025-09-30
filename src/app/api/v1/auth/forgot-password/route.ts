import { NextRequest, NextResponse } from 'next/server';
import { forgotPassword } from '@/lib/utils/better-auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;
    
    // Process forgot password
    const result = await forgotPassword(email);
    
    return NextResponse.json(result);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during forgot password',
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