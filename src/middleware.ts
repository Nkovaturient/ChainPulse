import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PROTECTED = ['/dashboard', '/app'];
const AUTH_ONLY  = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('cp_session')?.value ?? null;
  const user  = token ? await verifyToken(token) : null;
  const { pathname } = req.nextUrl;

  // Redirect logged-in users away from auth pages
  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Guard protected routes
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/app/:path*', '/login', '/signup'],
};
