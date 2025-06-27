"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { publicRoutePatterns } from "@/publicRoutes";

function SessionWatcher({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const pathname = usePathname();

    const isPublicRoute = publicRoutePatterns.some(pattern => pattern.test(pathname));

    useEffect(() => {
        if (status === "unauthenticated" && !isPublicRoute) {
            signOut({ callbackUrl: "/auth/login" });
        }
    }, [status, isPublicRoute]);

    return <>{children}</>;
}

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SessionWatcher>{children}</SessionWatcher>
        </SessionProvider>
    );
}
