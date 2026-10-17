import { LegalPageView } from '@sjolystinnovation/app-kit/legal';
import { publicGet } from '@/lib/publicApi';
import { LEGAL_LOCALE, type LegalPage } from '@/services/legalService';
import { LEGAL_PAGE_STRINGS, LEGAL_DATE_LOCALE } from '@/lib/legalPages';

// Matches PUBLIC_REVALIDATE_SECONDS. An admin edit shows within five minutes.
export const revalidate = 300;

/** The terms of service as an admin wrote them in garge-api. */
export default async function TermsPage() {
    const page = await publicGet<LegalPage>(`/content/legal/terms?locale=${LEGAL_LOCALE}`);
    return (
        <div className="appkit-dark">
            <LegalPageView page={page} title="Terms of Service" homeHref="/" dateLocale={LEGAL_DATE_LOCALE} strings={LEGAL_PAGE_STRINGS} />
        </div>
    );
}
