import { getPublicAppSettings } from '@/services/appSettingsService';

export const COMPANY = {
    name: 'Garge',
    legalName: 'Sjølyst Innovations',
    orgNumber: '934 531 035',
    address: 'Mårvegen 21a, 4347 Lye',
    email: 'sondresjoelyst@gmail.com',
} as const;

/**
 * Fetches AppSettings.VatEnabled from the backend. Per bokføringsforskriften
 * §5-1-1 nr. 2 the "MVA" suffix must follow the organisation number on
 * sales documents when the business is registered for Norwegian VAT.
 * Single source of truth: AppSettings.VatEnabled on the backend, toggled
 * from the admin settings page.
 */
export async function fetchVatEnabled(): Promise<boolean> {
    const settings = await getPublicAppSettings();
    return Boolean(settings?.vatEnabled);
}

export function formatOrgNumber(orgNumber: string, vatEnabled: boolean) {
    return vatEnabled ? `${orgNumber} MVA` : orgNumber;
}
