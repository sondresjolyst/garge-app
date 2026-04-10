"use client"

import React from 'react';
import { useSession } from 'next-auth/react';
import DeviceDashboard from './DeviceDashboard';
import MarketingPage from './MarketingPage';

const LoadingDots: React.FC = () => (
    <div className="h-64 flex items-center justify-center">
        <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
        </div>
    </div>
);

export default function HomePage() {
    const { status } = useSession();
    if (status === 'loading')       return <LoadingDots />;
    if (status === 'authenticated') return <DeviceDashboard />;
    return <MarketingPage />;
}
