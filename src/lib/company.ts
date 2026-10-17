import { cache } from 'react';
import { mergeCompanyInfo, type CompanyFallback, type CompanyInfo } from '@sjolystinnovation/app-kit/api';
import { getCompanyInfo } from '@/services/companyService';

/** The company details the public pages show while the API cannot answer. */
export const COMPANY = {
    name: 'Garge',
    legalName: 'Sjølyst Innovation AS',
    orgNumber: '938 517 789',
    address: 'Mårvegen 21a, 4347 Lye',
    email: 'sondresjoelyst@gmail.com',
} as const satisfies CompanyFallback;

/**
 * The company details for public pages: what an admin saved, read from garge-api's `/company`,
 * with COMPANY filling any field the API left blank or could not give. `vatRegistered` decides the
 * "MVA" suffix after the organisation number, which bokføringsforskriften §5-1-1 nr. 2 requires on
 * sales documents once the business is registered for Norwegian VAT. Cached per request, so the
 * footer and the page share one call.
 */
export const getCompany = cache(async (): Promise<CompanyInfo> => mergeCompanyInfo(await getCompanyInfo(), COMPANY));
