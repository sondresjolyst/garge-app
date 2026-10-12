"use client";

import { AppSessionProvider } from "@sjolystinnovation/app-kit/session/react";

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <AppSessionProvider>
            {children}
        </AppSessionProvider>
    );
}
