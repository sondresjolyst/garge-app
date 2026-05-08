export const COMPANY = {
    name: 'Garge',
    legalName: 'Sjølyst Innovations',
    orgNumber: '934 531 035',
    // Flip to true once registered for Norwegian VAT (MVA) with the Tax
    // Authority. Per bokføringsforskriften §5-1-1 nr. 2 the "MVA" suffix
    // must be shown on the organisation number on all sales documents
    // for VAT-registered businesses. Keep in sync with AppSettings.VatEnabled
    // on the backend.
    vatRegistered: false,
    address: 'Mårvegen 21a, 4347 Lye',
    email: 'sondresjoelyst@gmail.com',
} as const;

export const formatOrgNumber = () =>
    COMPANY.vatRegistered ? `${COMPANY.orgNumber} MVA` : COMPANY.orgNumber;
