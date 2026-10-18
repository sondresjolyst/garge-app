import { requireEnv } from '@sjolystinnovation/app-kit';
import { createPublicApi } from '@sjolystinnovation/app-kit/server';

/**
 * The seconds a cached public GET stays fresh. An admin save purges its pages at once through
 * /api/revalidate. This is the fallback for when that request fails.
 */
export const PUBLIC_REVALIDATE_SECONDS = 300;

const apiUrl = requireEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL);

/**
 * Cached GETs against garge-api's anonymous endpoints, for server components and route handlers.
 * A failed fetch during next build gives null with a warning, so the legal pages and the sitemap
 * build without the API and fill in on their first revalidate.
 */
export const { publicGet, publicGetOptional } = createPublicApi(apiUrl, {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    nullOnFailureDuringBuild: true,
});
