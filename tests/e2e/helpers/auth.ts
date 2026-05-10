import { Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';

const NEXTAUTH_SECRET = 'foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobar';

export interface MockUser {
    id: string;
    email: string;
    name: string;
    roles: string[];
}

export const adminUser: MockUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    roles: ['Admin'],
};

export const regularUser: MockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Regular User',
    roles: [],
};

export async function mockSession(page: Page, user: MockUser) {
    const token = await encode({
        secret: NEXTAUTH_SECRET,
        token: {
            user: { id: user.id, name: user.name, email: user.email, roles: user.roles },
            accessToken: 'test-access-token',
            accessTokenExpires: Date.now() + 3_600_000,
            loginAt: Date.now(),
        },
        maxAge: 3600,
    });
    await page.context().addCookies([{
        name: 'next-auth.session-token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
    }]);
}

export async function mockApi(page: Page, path: string, body: unknown, status = 200) {
    await page.route(`**${path}`, route =>
        route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(body),
        })
    );
}

export async function mockNoSession(page: Page) {
    await page.context().clearCookies();
}
