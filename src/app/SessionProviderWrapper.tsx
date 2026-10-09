"use client";

import { SessionProvider } from "next-auth/react";
import SessionGuard from "@/components/SessionGuard";

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
            <SessionGuard />
        </SessionProvider>
    );
}
