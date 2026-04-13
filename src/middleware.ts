import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;

export default async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret });

    // If authenticated and trying to access login, redirect to profile
    if (token?.accessToken) {
        return NextResponse.redirect(new URL('/profile', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login'],
};

