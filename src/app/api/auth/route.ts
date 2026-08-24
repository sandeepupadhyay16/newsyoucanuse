import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET || '';
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3004';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, avatarUrl, provider, role } = body;

    if (!email || !name || !provider) {
      return NextResponse.json({ error: 'Missing required sign-in parameters' }, { status: 400 });
    }

    // Determine role (demouser_promaxultra is the default Editor/Admin)
    let userRole = role || 'READER';
    if (email.toLowerCase().includes('demouser_promaxultra') || email.toLowerCase().includes('farrelly') || email.toLowerCase() === 'admin@ai-insights.com' || name.toLowerCase().includes('demouser_promaxultra') || name.toLowerCase().includes('farrelly')) {
      userRole = 'EDITOR';
    }

    // Find or create user in the database
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          role: userRole,
          provider
        }
      });
    } else {
      user = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          name,
          avatarUrl: avatarUrl || user.avatarUrl,
          provider,
          role: userRole
        }
      });
    }

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error('API POST auth failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // 1. Redirection trigger to OAuth consent screen
    if (provider && !code) {
      const redirectUri = `${NEXTAUTH_URL}/api/auth`;
      
      if (provider === 'google' && GOOGLE_CLIENT_ID) {
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
          new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state: 'google-oauth-state'
          }).toString();
        return NextResponse.redirect(googleAuthUrl);
      }
      
      if (provider === 'apple' && APPLE_CLIENT_ID) {
        const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` + 
          new URLSearchParams({
            client_id: APPLE_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'name email',
            state: 'apple-oauth-state',
            response_mode: 'form_post'
          }).toString();
        return NextResponse.redirect(appleAuthUrl);
      }
      
      return NextResponse.json({ error: 'OAuth provider client ID not configured in .env' }, { status: 400 });
    }

    // 2. Callback code exchange handler (Google callback)
    if (code) {
      const redirectUri = `${NEXTAUTH_URL}/api/auth`;
      
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
          throw new Error(tokenData.error_description || 'Failed to retrieve access token');
        }

        // Fetch user profile from google userinfo
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const profile = await profileRes.json();

        // Redirect back to app client with credentials in parameters
        const destination = new URL(NEXTAUTH_URL);
        destination.searchParams.set('auth_success', 'true');
        destination.searchParams.set('email', profile.email);
        destination.searchParams.set('name', profile.name || profile.email.split('@')[0]);
        destination.searchParams.set('avatarUrl', profile.picture || '');
        destination.searchParams.set('provider', 'Google');
        
        return NextResponse.redirect(destination.toString());
      } catch (err: any) {
        console.error('Google token exchange failed:', err);
        return NextResponse.redirect(`${NEXTAUTH_URL}?auth_error=${encodeURIComponent(err.message)}`);
      }
    }

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true, user });

  } catch (error: any) {
    console.error('API GET auth failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
