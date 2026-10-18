import { createLegalService, type LegalPage as AppKitLegalPage } from '@sjolystinnovation/app-kit/api';
import axiosInstance from './axiosInstance';
import publicClient from './publicClient';
import { REVALIDATE_TARGETS, revalidateTarget } from '@/lib/cacheTags';

/** Garge writes its legal pages in English only. */
export const LEGAL_LOCALE = 'en';

/** The terms, privacy and cookies pages, from garge-api's `/content/legal`. */
const LegalService = createLegalService(axiosInstance, publicClient, {
    onSaved: () => revalidateTarget(REVALIDATE_TARGETS.legal),
});

export type LegalKey = (typeof LegalService.keys)[number];

export type LegalPage = AppKitLegalPage<LegalKey>;

export default LegalService;
