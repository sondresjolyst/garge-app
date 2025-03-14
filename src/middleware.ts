import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

const protectedRoutePatterns = [/^\/dashboard/, /^\/profile/, /^\/sensors/];
const publicRoutePatterns = [/^\/login$/, /^\/register$/, /^\/$/];

export default async function middleware(req: NextRequest) {
    console.log('Middleware executed');
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutePatterns.some((pattern) => pattern.test(path));
    const isPublicRoute = publicRoutePatterns.some((pattern) => pattern.test(path));

    console.log(`Path: ${path}`);
    console.log(`Is Protected Route: ${isProtectedRoute}`);
    console.log(`Is Public Route: ${isPublicRoute}`);

    const token = await getToken({ req, secret });
    console.log(`Token: ${JSON.stringify(token)}`);

    if (isProtectedRoute && !token?.accessToken) {
        console.log('Redirecting to /login');
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isPublicRoute && token?.accessToken && path === '/login') {
        console.log('Redirecting to /profile');
        return NextResponse.redirect(new URL('/profile', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
