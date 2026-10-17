import { requireEnv } from '@sjolystinnovation/app-kit';
import { createPublicApi } from '@sjolystinnovation/app-kit/server';

/** The seconds a cached public GET stays fresh. Garge has no revalidate route, so an admin edit shows within this time. */
export const PUBLIC_REVALIDATE_SECONDS = 300;

/** Cached GETs against garge-api's anonymous endpoints, for server components and route handlers. */
export const { publicGet, publicGetOptional } = createPublicApi(
    requireEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
    { revalidate: PUBLIC_REVALIDATE_SECONDS },
);
