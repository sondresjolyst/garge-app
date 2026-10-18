import { requireEnv } from '@sjolystinnovation/app-kit';
import { createPublicApi } from '@sjolystinnovation/app-kit/server';

/**
 * The seconds a cached public GET stays fresh. An admin save purges its pages at once through
 * /api/revalidate. This is the fallback for when that request fails.
 */
export const PUBLIC_REVALIDATE_SECONDS = 300;

const apiUrl = requireEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL);

/** Cached GETs against garge-api's anonymous endpoints, for server components and route handlers. */
export const { publicGet, publicGetOptional } = createPublicApi(apiUrl, { revalidate: PUBLIC_REVALIDATE_SECONDS });

/**
 * The same GETs without the cache, for what a save outside the revalidate targets changes, such as
 * the company details that the VAT toggle in Site Settings also sets.
 */
export const { publicGetOptional: uncachedGetOptional } = createPublicApi(apiUrl, { revalidate: 0 });
