import type { CompanyInfo } from '@sjolystinnovation/app-kit/api';
import { publicGetOptional } from '@/lib/publicApi';
import { REVALIDATE_TARGETS } from '@/lib/cacheTags';

/**
 * Fetches the public company info from garge-api's anonymous `/company` endpoint, served by
 * SjolystInnovation.AppKit.SiteSettings. Cached under the company target, which the company details
 * save and the VAT settings purge, so a save shows on the next page load.
 *
 * Returns `null` when the backend is unreachable or fails, so the caller can fall back to the app's
 * own values.
 */
export function getCompanyInfo(): Promise<Partial<CompanyInfo> | null> {
    return publicGetOptional<Partial<CompanyInfo>>('/company', { tags: [REVALIDATE_TARGETS.company] });
}
