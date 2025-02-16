import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Define route patterns
const protectedRoutePatterns = [/^\/dashboard/, /^\/profile/];
const publicRoutePatterns = [/^\/login$/, /^\/register$/, /^\/$/];

export default async function middleware(req: NextRequest) {
    console.log('Middleware executed');
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutePatterns.some((pattern) => pattern.test(path));
    const isPublicRoute = publicRoutePatterns.some((pattern) => pattern.test(path));

    console.log(`Path: ${path}`);
    console.log(`Is Protected Route: ${isProtectedRoute}`);
    console.log(`Is Public Route: ${isPublicRoute}`);

    const cookie = (await cookies()).get('jwtToken')?.value;
    console.log(`Cookie: ${cookie}`);
    let session: JWTPayload | null = null;
    if (cookie) {
        try {
            const { payload } = await jwtVerify(cookie, secret);
            session = payload;
            console.log(`Session: ${JSON.stringify(session)}`);
        } catch (error) {
            console.error('Failed to verify token:', error);
        }
    }

    if (isProtectedRoute && !session?.sub) {
        console.log('Redirecting to /login');
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // Redirect to / if the user is authenticated
    if (isPublicRoute && session?.sub && !req.nextUrl.pathname.startsWith('/')) {
        console.log('Redirecting to /');
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};