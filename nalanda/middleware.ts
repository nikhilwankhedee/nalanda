import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin routes that require authentication and admin role
const adminRoutes = '/admin';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for an admin route
  if (pathname.startsWith(adminRoutes)) {
    // Skip middleware for admin login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Get session cookie
    const sessionCookie = request.cookies.get('next-auth.session-token')?.value;

    // If no session, redirect to admin login
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For admin routes (except login), we need to verify the user has admin role
    // The role check is done in the layout, but we need to prevent direct access
    // by checking for a role cookie set during login
    const userRole = request.cookies.get('user_role')?.value;

    if (!userRole || userRole !== 'ADMIN') {
      // Not verified as admin, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
