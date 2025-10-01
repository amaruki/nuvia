import { NextRequest, NextResponse } from 'next/server';

// List of supported OAuth providers
const SUPPORTED_PROVIDERS = ['google', 'github', 'linkedin'];

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  
  
  // Validate the provider
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    console.error("Unsupported OAuth provider:", provider);

    const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
    errorUrl.searchParams.set('error', 'unsupported_provider');
    errorUrl.searchParams.set('error_description', `Unsupported OAuth provider: ${provider}`);
    
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Extract OAuth callback parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    
    // If there's an error, redirect to the callback page with error details
    if (error) {
      console.error("OAuth callback error:", { provider, error });
      
      const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
      errorUrl.searchParams.set('error', error);
      errorUrl.searchParams.set('provider', provider);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      
      return NextResponse.redirect(errorUrl);
    }

    // If we have code and state, redirect to the main callback page
    if (code && state) {
      
      const callbackUrl = new URL(`${process.env.APP_URL}/auth/callback`);
      callbackUrl.searchParams.set('code', code);
      callbackUrl.searchParams.set('state', state);
      callbackUrl.searchParams.set('provider', provider);
      
      return NextResponse.redirect(callbackUrl);
    }

    // If we're missing required parameters, redirect with error
    console.error("Missing OAuth callback parameters:", { provider });

    const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
    errorUrl.searchParams.set('error', 'missing_parameters');
    errorUrl.searchParams.set('provider', provider);
    errorUrl.searchParams.set('error_description', 'Missing required OAuth callback parameters');
    
    return NextResponse.redirect(errorUrl);
  } catch (err) {
    console.error("OAuth callback unexpected error:", err instanceof Error ? err.message : String(err));

    const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
    errorUrl.searchParams.set('error', 'server_error');
    errorUrl.searchParams.set('provider', provider);
    errorUrl.searchParams.set('error_description', 'An unexpected error occurred during OAuth callback');
    
    return NextResponse.redirect(errorUrl);
  }
}