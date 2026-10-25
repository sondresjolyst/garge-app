import axios from 'axios';
import { createLegalService, type LegalPage as AppKitLegalPage } from '@sjolystinnovation/app-kit/api';
import axiosInstance from './axiosInstance';
import publicClient from './publicClient';
import { REVALIDATE_TARGETS, revalidateTarget } from '@/lib/cacheTags';
import { formatApiError } from '@/lib/errorMessages';

/** Garge writes its legal pages in English only. */
export const LEGAL_LOCALE = 'en';

/** The terms version sent when garge-api has no terms page. The API accepts any version then. */
export const NO_TERMS_VERSION = 'no-terms-page';

/** The terms, privacy and cookies pages, from garge-api's `/content/legal`. */
const LegalService = createLegalService(axiosInstance, publicClient, {
    onSaved: () => revalidateTarget(REVALIDATE_TARGETS.legal),
});

export type LegalKey = (typeof LegalService.keys)[number];

export type LegalPage = AppKitLegalPage<LegalKey>;

/**
 * The version of the current terms, which registration sends back when the user accepts them.
 * A missing terms page gives NO_TERMS_VERSION. Any other failure throws, so the form waits.
 */
export async function getTermsVersion(): Promise<string> {
    try {
        const { data } = await publicClient.get<LegalPage>('/content/legal/terms', { params: { locale: LEGAL_LOCALE } });
        if (typeof data?.version !== 'string' || data.version === '') throw new Error('The terms page has no version');
        return data.version;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return NO_TERMS_VERSION;
        throw new Error(formatApiError(error, 'Failed to load the terms'));
    }
}

export default LegalService;
