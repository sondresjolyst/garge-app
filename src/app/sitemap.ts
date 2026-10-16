import { MetadataRoute } from 'next';
import { site } from '@/lib/seo/site';

const PAGES = ['', '/contact', '/privacy', '/terms', '/cookies'];

export default function sitemap(): MetadataRoute.Sitemap {
    return PAGES.flatMap(path => site.localeEntries(path));
}
