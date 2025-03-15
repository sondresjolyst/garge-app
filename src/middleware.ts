import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

const protectedRoutePatterns = [/^\/dashboard/, /^\/profile/, /^\/sensors/];
const publicRoutePatterns = [/^\/login$/, /^\/register$/, /^\/$/];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Bypass middleware for static assets
    if (path.startsWith('/_next/') || path.startsWith('/favicon.ico')) {
        return NextResponse.next();
    }

    const isProtectedRoute = protectedRoutePatterns.some((pattern) => pattern.test(path));
    const isPublicRoute = publicRoutePatterns.some((pattern) => pattern.test(path));

    const token = await getToken({ req, secret });

    if (isProtectedRoute && !token?.accessToken) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isPublicRoute && token?.accessToken && path === '/login') {
        return NextResponse.redirect(new URL('/profile', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
