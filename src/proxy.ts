import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/api/auth/callback', '/pending'];
const AUTH_ROUTES = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r) || pathname.startsWith('/api/auth/');
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));

  // Read the role cookie set by the callback
  const userRole = request.cookies.get('x-user-role')?.value;
  const isAuthenticated = !!userRole;

  // Redirect authenticated users away from login
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublic && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Block pending users from protected routes
  if (isAuthenticated && userRole === 'pending' && !isPublic) {
    return NextResponse.redirect(new URL('/pending', request.url));
  }

  // Block non-admin from admin routes
  if (pathname.startsWith('/admin') && isAuthenticated) {
    if (!['staff', 'admin'].includes(userRole ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};