import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export default async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret });
    const { pathname } = req.nextUrl;

    if (pathname === '/login') {
        if (token?.accessToken) {
            return NextResponse.redirect(new URL('/profile', req.nextUrl));
        }
        return NextResponse.next();
    }

    if (!token?.accessToken) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (pathname.startsWith('/admin')) {
        const roles = (token.user as { roles?: string[] } | undefined)?.roles ?? [];
        if (!roles.includes('Admin')) {
            return NextResponse.redirect(new URL('/', req.nextUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login', '/admin/:path*', '/profile/:path*', '/automations/:path*', '/electricity/:path*', '/shop/:path*'],
};

