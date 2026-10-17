import { MetadataRoute } from 'next';
import { site } from '@/lib/seo/site';
import { publicGet } from '@/lib/publicApi';
import { REVALIDATE_TARGETS } from '@/lib/cacheTags';
import LegalService, { LEGAL_LOCALE, type LegalPage } from '@/services/legalService';

// Matches PUBLIC_REVALIDATE_SECONDS, the fallback when an admin save could not purge the sitemap.
export const revalidate = 300;

const PAGES = ['', '/contact'];

/** The public pages, with each legal page dated by when an admin last saved it. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const legal = await site.legalEntries({
        keys: LegalService.keys,
        updatedAt: async key =>
            (await publicGet<LegalPage>(`/content/legal/${key}?locale=${LEGAL_LOCALE}`, { tags: [REVALIDATE_TARGETS.legal] }))?.updatedAt,
    });
    return [...PAGES.flatMap(path => site.localeEntries(path)), ...legal];
}
