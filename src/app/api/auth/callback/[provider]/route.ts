import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  
  // Instead of redirecting, we'll directly handle the OAuth callback
  // This ensures better-auth processes the callback correctly
  try {
    // Forward the request to better-auth's handler
    const response = await auth.handler(request);
    
    // If the response is a redirect, ensure it goes to the right place
    if (response instanceof NextResponse && response.headers.get('location')) {
      const location = response.headers.get('location');
      
      // If it's redirecting to the callback page, let it proceed
      if (location?.includes('/auth/callback')) {
        return response;
      }
      
      // Otherwise, redirect to the dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    
    // If there's an error, redirect to the callback page with error details
    const errorUrl = new URL('/auth/callback', request.url);
    errorUrl.searchParams.set('error', 'oauth_failed');
    errorUrl.searchParams.set('provider', provider);
    errorUrl.searchParams.set('error_description', 'Failed to process OAuth authentication');
    
    return NextResponse.redirect(errorUrl);
  }
}