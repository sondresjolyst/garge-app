import { requireEnv } from '@sjolystinnovation/app-kit';
import { createPublicApi } from '@sjolystinnovation/app-kit/server';

/**
 * The seconds a cached public GET stays fresh. An admin save purges its pages at once through
 * /api/revalidate. This is the fallback for when that request fails.
 */
export const PUBLIC_REVALIDATE_SECONDS = 300;

/** Cached GETs against garge-api's anonymous endpoints, for server components and route handlers. */
export const { publicGet, publicGetOptional } = createPublicApi(
    requireEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
    { revalidate: PUBLIC_REVALIDATE_SECONDS },
);
