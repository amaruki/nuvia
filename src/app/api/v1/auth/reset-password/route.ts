import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token, newPassword } = body;
    
    // Process reset password using Better Auth API
    await auth.api.resetPassword({
      body: {
        token: token,
        newPassword: newPassword
      }
    });

    // Create a standardized response
    const response = {
      success: true,
      message: 'Password reset successful'
    };

    return NextResponse.json(response);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during password reset',
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