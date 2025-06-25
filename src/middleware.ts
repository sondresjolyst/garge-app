import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

const publicRoutePatterns = [/^\/login$/, /^\/register$/, /^\/$/, /^\/api$/, /^\/reset-password$/];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    if (path.startsWith('/_next/') || path.startsWith('/favicon.ico')) {
        return NextResponse.next();
    }

    const isPublicRoute = publicRoutePatterns.some((pattern) => pattern.test(path));

    const token = await getToken({ req, secret });

    // If not public and not authenticated, redirect to login
    if (!isPublicRoute && !token?.accessToken) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // If authenticated and trying to access login, redirect to profile
    if (isPublicRoute && token?.accessToken && path === '/login') {
        return NextResponse.redirect(new URL('/profile', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
