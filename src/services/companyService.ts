import type { CompanyInfo } from '@sjolystinnovation/app-kit/api';

/**
 * Fetches the public company info from garge-api's anonymous `/company` endpoint, served by
 * SjolystInnovation.AppKit.SiteSettings. A plain `fetch`, because public pages render it on the
 * server before anyone signs in.
 *
 * Returns `null` when the backend is unreachable or the URL is unconfigured, so the caller can fall
 * back to the app's own values.
 */
export async function getCompanyInfo(): Promise<Partial<CompanyInfo> | null> {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return null;

    try {
        const res = await fetch(`${base}/company`, { cache: 'no-store' });
        if (!res.ok) return null;
        return (await res.json()) as Partial<CompanyInfo>;
    } catch {
        return null;
    }
}
