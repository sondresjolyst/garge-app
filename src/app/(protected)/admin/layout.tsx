"use client";

import { RoleGate } from '@sjolystinnovation/app-kit/session/react';
import LoadingDots from '@/components/LoadingDots';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGate role="Admin" fallback={<LoadingDots height="h-64" />} deniedHref="/">
            {children}
        </RoleGate>
    );
}
