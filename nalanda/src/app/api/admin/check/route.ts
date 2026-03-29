import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Check admin status
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ authenticated: false });
  }

  const isAdmin = session.user.role === 'ADMIN';

  const response = NextResponse.json({
    authenticated: true,
    isAdmin,
    user: {
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  });

  // Set role cookie for middleware
  if (isAdmin) {
    response.cookies.set('user_role', 'ADMIN', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  return response;
}
