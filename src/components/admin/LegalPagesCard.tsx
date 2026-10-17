'use client';

import { LegalPagesEditor } from '@sjolystinnovation/app-kit/admin';
import LegalService, { LEGAL_LOCALE } from '@/services/legalService';

const LOCALES = [LEGAL_LOCALE] as const;
const LOCALE_LABELS = { [LEGAL_LOCALE]: 'English' } as const;

/** The editor for the terms, privacy and cookies pages, in garge's dark admin colors. */
export default function LegalPagesCard() {
    return (
        <div className="appkit-dark">
            <LegalPagesEditor
                service={LegalService}
                locales={LOCALES}
                localeLabels={LOCALE_LABELS}
                strings={{ heading: 'Terms, privacy and cookies' }}
            />
        </div>
    );
}
