"use client";

import { AppSessionProvider } from "@sjolystinnovation/app-kit/session/react";
import SessionGuard from "@/components/SessionGuard";

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <AppSessionProvider>
            {children}
            <SessionGuard />
        </AppSessionProvider>
    );
}
