import type { NextConfig } from "next";

function getApiOrigin(): string {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) return '';
    try {
        const { origin } = new URL(url);
        return origin;
    } catch {
        return '';
    }
}

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
        qualities: [75, 100],
    },
    async headers() {
        const apiOrigin = getApiOrigin();
        const connectSrc = ['self', apiOrigin].filter(Boolean).map(s => s === 'self' ? "'self'" : s).join(' ');

        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            `connect-src ${connectSrc}`,
            "font-src 'self'",
            "frame-ancestors 'none'",
        ].join('; ');

        const headers = [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'X-DNS-Prefetch-Control', value: 'on' },
            { key: 'Content-Security-Policy', value: csp },
        ];

        return [{ source: '/(.*)', headers }];
    },
};

export default nextConfig;
