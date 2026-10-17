'use client';

import { BrandingManager } from '@sjolystinnovation/app-kit/branding';
import BrandingService from '@/services/brandingService';

/** The logo and favicon upload, in garge's dark admin colors. */
export default function BrandingCard() {
    return (
        <div className="appkit-dark">
            <BrandingManager save={BrandingService.update} strings={{ title: 'Logo and favicon' }} />
        </div>
    );
}
