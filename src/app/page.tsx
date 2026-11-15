"use client"

import { useSession } from 'next-auth/react';
import { ProtectedGate } from '@sjolystinnovation/app-kit/session/react';
import DeviceDashboard from './DeviceDashboard';
import MarketingPage from './MarketingPage';
import LoadingDots from '@/components/LoadingDots';
import SessionGuard from '@/components/SessionGuard';

export default function HomePage() {
    const { status } = useSession();
    if (status === 'loading')         return <LoadingDots height="h-64" />;
    if (status === 'unauthenticated') return <MarketingPage />;
    // A session that has ended still reads as authenticated, so the dashboard is gated like a protected page.
    return (
        <>
            <ProtectedGate loginHref="/login" fallback={<LoadingDots height="h-64" />}>
                <DeviceDashboard />
            </ProtectedGate>
            <SessionGuard />
        </>
    );
}
