import { join } from 'path';
import { brandingIcon } from '@sjolystinnovation/app-kit/branding/server';
import { publicGet } from '@/lib/publicApi';
import type { Branding } from '@/services/brandingService';
import { REVALIDATE_TARGETS } from '@/lib/cacheTags';

// The <link rel="icon"> Next writes says image/png, so the bundled icon is the PNG frame of
// favicon.ico. An uploaded PNG matches it as well.
export const contentType = 'image/png';

// A prerendered copy would carry the build-time icon into every new pod.
export const dynamic = 'force-dynamic';

/** The favicon set in admin settings, or the bundled one when none is set. */
export default function Icon(): Promise<Response> {
    return brandingIcon({
        load: () => publicGet<Branding>('/branding', { tags: [REVALIDATE_TARGETS.branding] }),
        fallbackPath: join(process.cwd(), 'public', 'favicon.png'),
        fallbackType: 'image/png',
    });
}
