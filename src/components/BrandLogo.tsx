'use client';

import Image from 'next/image';
import { useBranding } from '@sjolystinnovation/app-kit/branding';

/** The bundled logo, shown until an admin uploads one. */
export const FALLBACK_LOGO = '/garge-icon-large.png';

interface BrandLogoProps {
    className: string;
    /** The bundled logo's intrinsic size for next/image. */
    width: number;
    height: number;
    alt?: string;
    priority?: boolean;
    unoptimized?: boolean;
    quality?: number;
}

/** The logo set in admin settings, or the bundled one when none is set. */
export default function BrandLogo({ className, width, height, alt = 'Garge', priority, unoptimized, quality }: BrandLogoProps) {
    const { logoUrl } = useBranding();
    if (logoUrl) {
        // A data: URL from the API, which next/image does not optimize.
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={logoUrl} alt={alt} className={className} />;
    }
    return <Image src={FALLBACK_LOGO} width={width} height={height} className={className} alt={alt} priority={priority} unoptimized={unoptimized} quality={quality} />;
}
