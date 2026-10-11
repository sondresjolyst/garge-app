import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import robots from '@/app/robots';

const original = { ...process.env };

beforeEach(() => { delete process.env.SITE_ENV; });
afterEach(() => { process.env = { ...original }; });

describe('robots', () => {
    it('lets the live site be crawled, except signed-in pages and the API', () => {
        process.env.SITE_ENV = 'prod';
        expect(robots()).toEqual({
            rules: {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/automations', '/electricity', '/profile', '/shop', '/login', '/register', '/reset-password', '/api/'],
            },
            sitemap: 'https://www.garge.no/sitemap.xml',
            host: 'https://www.garge.no',
        });
    });

    it('disallows everything on a test host', () => {
        process.env.SITE_ENV = 'dev';
        expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
    });
});
