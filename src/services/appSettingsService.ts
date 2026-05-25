import { AppSettings } from '@/services/adminService';

/**
 * Fetches the public AppSettings from garge-api's `/admin/settings` endpoint.
 *
 * This read is intentionally unauthenticated: the settings drive public-facing
 * behaviour (cookie banner visibility, VAT suffix on invoices) that must render
 * before a user signs in. A plain `fetch` is used rather than `axiosInstance`
 * because no JWT is required, but the call still lives in `services/` per the
 * architecture rule that all HTTP belongs here.
 *
 * Returns `null` when the backend is unreachable or the URL is unconfigured so
 * callers can apply their own defaults.
 */
export async function getPublicAppSettings(): Promise<AppSettings | null> {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return null;

    try {
        const res = await fetch(`${base}/admin/settings`, { cache: 'no-store' });
        if (!res.ok) return null;
        return (await res.json()) as AppSettings;
    } catch {
        return null;
    }
}
