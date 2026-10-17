"use client";

import { AppSessionProvider } from "@sjolystinnovation/app-kit/session/react";
import { BrandingProvider } from "@sjolystinnovation/app-kit/branding";
import BrandingService, { type Branding } from "@/services/brandingService";

export default function SessionProviderWrapper({ children, initialBranding }: { children: React.ReactNode; initialBranding?: Branding | undefined }) {
    return (
        <AppSessionProvider>
            <BrandingProvider load={BrandingService.get} initial={initialBranding}>
                {children}
            </BrandingProvider>
        </AppSessionProvider>
    );
}
