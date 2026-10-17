import type { CompanyInfo } from '@sjolystinnovation/app-kit/api';
import { uncachedGetOptional } from '@/lib/publicApi';

/**
 * Fetches the public company info from garge-api's anonymous `/company` endpoint, served by
 * SjolystInnovation.AppKit.SiteSettings. Uncached, so a save shows on the next page load.
 *
 * Returns `null` when the backend is unreachable or fails, so the caller can fall back to the app's
 * own values.
 */
export function getCompanyInfo(): Promise<Partial<CompanyInfo> | null> {
    return uncachedGetOptional<Partial<CompanyInfo>>('/company');
}
