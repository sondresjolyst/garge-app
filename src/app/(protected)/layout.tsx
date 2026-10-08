"use client";

import React from 'react';
import { ProtectedGate } from '@sjolystinnovation/app-kit/session/react';
import LoadingDots from '@/components/LoadingDots';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedGate loginHref="/login" fallback={<LoadingDots height="h-64" />}>
            {children}
        </ProtectedGate>
    );
}
