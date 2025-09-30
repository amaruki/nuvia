import { NextRequest, NextResponse } from 'next/server';
import { changePassword } from '@/lib/utils/better-auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    // Process change password
    const result = await changePassword(currentPassword, newPassword);
    
    return NextResponse.json(result);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while changing password',
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