"use client"

import { useSession } from 'next-auth/react';
import DeviceDashboard from './DeviceDashboard';
import MarketingPage from './MarketingPage';
import LoadingDots from '@/components/LoadingDots';

export default function HomePage() {
    const { status } = useSession();
    if (status === 'loading')       return <LoadingDots height="h-64" />;
    if (status === 'authenticated') return <DeviceDashboard />;
    return <MarketingPage />;
}
